import { describe, expect, it } from 'vitest';
import { EnemyKind } from '../config/enemies.ts';
import { HeroId } from '../config/heroes.ts';
import { UpgradeStat } from '../config/upgrades.ts';
import { WeaponId } from '../config/weapons.ts';
import { EnemyAction } from '../model/EnemyAction.ts';
import { LifeState } from '../model/LifeState.ts';
import { MatchPhase } from '../model/MatchPhase.ts';
import { createStartingLoadout, withUpgradeApplied } from '../rules/loadoutRules.ts';
import { ShopOfferKind } from '../rules/ShopOffer.ts';
import { ClientMessageType } from './ClientMessage.ts';
import type { ClientMessage } from './ClientMessage.ts';
import { GameEventType } from './GameEvent.ts';
import {
  decodeClientMessage,
  decodeServerMessage,
  encodeClientMessage,
  encodeServerMessage,
} from './messageCodec.ts';
import { ProtocolError } from './ProtocolError.ts';
import { dequantizeRatio, quantizeRatio, roundTripAngle, roundTripAxis } from './quantization.ts';
import { ServerMessageType } from './ServerMessage.ts';
import type { ServerMessage } from './ServerMessage.ts';

describe('message codec', () => {
  it('round-trips client messages', () => {
    const messages: ClientMessage[] = [
      {
        type: ClientMessageType.Hello,
        protocolVersion: 1,
        nickname: 'Пиппин',
        resumeToken: 'token-42',
      },
      { type: ClientMessageType.JoinRoom, code: 'ABCD' },
      { type: ClientMessageType.SelectHero, hero: HeroId.Agatha },
      {
        type: ClientMessageType.PlayerInput,
        sequence: 42,
        viewTick: 1000,
        moveX: roundTripAxis(0.5),
        moveY: roundTripAxis(-1),
        aim: roundTripAngle(1.25),
        buttons: 3,
      },
      {
        type: ClientMessageType.Purchase,
        offer: {
          kind: ShopOfferKind.UpgradeWeapon,
          weapon: WeaponId.Rifle,
          stat: UpgradeStat.FireRate,
        },
      },
      { type: ClientMessageType.Ping, clientTime: 123.456 },
      { type: ClientMessageType.SetBotCount, count: 3 },
    ];
    for (const message of messages) {
      expect(decodeClientMessage(encodeClientMessage(message))).toEqual(message);
    }
  });

  it('round-trips a snapshot with events', () => {
    const snapshot: ServerMessage = {
      type: ServerMessageType.Snapshot,
      tick: 77,
      phase: MatchPhase.Combat,
      wave: 3,
      phaseTicksLeft: 0,
      enemiesRemaining: 12,
      players: [
        {
          id: 1,
          hero: HeroId.Pippin,
          x: 10.5,
          y: 4.25,
          aim: roundTripAngle(-2),
          health: 120,
          maxHealth: 150,
          life: LifeState.Alive,
          weapon: WeaponId.Shotgun,
          ammo: 4,
          flags: 0,
          reviveProgress: 0,
          bleedoutProgress: 0,
          coins: 340,
          lastInputSequence: 99,
        },
      ],
      enemies: [
        {
          id: 5,
          kind: EnemyKind.Ghost,
          x: 3.5,
          y: 7.75,
          facing: roundTripAngle(0.5),
          healthFraction: 1,
          action: EnemyAction.Attacking,
        },
      ],
      pickups: [],
      merchant: { healthFraction: dequantizeRatio(quantizeRatio(0.5)), wavesUntilReturn: 0 },
      events: [
        { type: GameEventType.MerchantKilled, killerId: 3 },
        { type: GameEventType.MerchantReturned },
        {
          type: GameEventType.EnemyKilled,
          enemyId: 5,
          kind: EnemyKind.Ghost,
          killerId: 1,
          x: 3.5,
          y: 7.75,
        },
        { type: GameEventType.WaveCleared, wave: 3 },
      ],
    };
    expect(decodeServerMessage(encodeServerMessage(snapshot))).toEqual(snapshot);
  });

  it('round-trips a room with bots', () => {
    const message: ServerMessage = {
      type: ServerMessageType.RoomState,
      code: 'ABCD',
      hostId: 1,
      inMatch: false,
      members: [
        { clientId: 1, nickname: 'Пиппин', hero: HeroId.Pippin, ready: false, isBot: false },
        { clientId: 0xff00, nickname: 'Фрося', hero: HeroId.Agatha, ready: true, isBot: true },
      ],
    };
    expect(decodeServerMessage(encodeServerMessage(message))).toEqual(message);
  });

  it('round-trips loadouts', () => {
    const loadout = withUpgradeApplied(
      createStartingLoadout(),
      WeaponId.Pistol,
      UpgradeStat.Damage,
    );
    const message: ServerMessage = { type: ServerMessageType.LoadoutUpdate, loadout };
    expect(decodeServerMessage(encodeServerMessage(message))).toEqual(message);
  });

  it('rejects truncated, trailing and out-of-range payloads', () => {
    const bytes = encodeClientMessage({ type: ClientMessageType.SelectHero, hero: HeroId.Pippin });
    expect(() => decodeClientMessage(bytes.subarray(0, 1))).toThrow(ProtocolError);
    expect(() => decodeClientMessage(new Uint8Array([...bytes, 0]))).toThrow(ProtocolError);
    expect(() => decodeClientMessage(new Uint8Array([ClientMessageType.SelectHero, 200]))).toThrow(
      ProtocolError,
    );
    expect(() => decodeClientMessage(new Uint8Array([250]))).toThrow(ProtocolError);
  });
});
