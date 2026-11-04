import { describe, expect, it } from 'vitest';
import { EnemyKind } from '../config/enemies.ts';
import { HeroId } from '../config/heroes.ts';
import { UpgradeStat } from '../config/upgrades.ts';
import { WeaponId } from '../config/weapons.ts';
import { EnemyAction } from '../model/EnemyAction.ts';
import { LifeState } from '../model/LifeState.ts';
import { flagSetOf } from '../core/FlagSet.ts';
import { PlayerFlag } from '../model/PlayerFlag.ts';
import { MatchPhase } from '../model/MatchPhase.ts';
import { TrapState } from '../model/TrapState.ts';
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

const RELOADING = flagSetOf([PlayerFlag.Reloading]);

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
      { type: ClientMessageType.Ping, clientTime: 123.456, roundTripMilliseconds: 48 },
      { type: ClientMessageType.SetBotCount, count: 3 },
      { type: ClientMessageType.ArmTrap, cell: 304 },
      {
        type: ClientMessageType.SetMatchSettings,
        settings: { totalWaves: 20, friendlyFire: false },
      },
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
          height: 0.375,
          verticalSpeed: -2.5,
          aim: roundTripAngle(-2),
          health: 120,
          maxHealth: 150,
          life: LifeState.Alive,
          weapon: WeaponId.Shotgun,
          ammo: 4,
          melee: WeaponId.Axe,
          weaponGrade: 2,
          meleeGrade: 9,
          meleeCharge: 7,
          furyProgress: dequantizeRatio(quantizeRatio(0.4)),
          flags: flagSetOf([PlayerFlag.Firing]),
          reloadProgress: 0,
          reviveProgress: 0,
          bleedoutProgress: 0,
          coins: 340,
          pingMilliseconds: 61,
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
      merchant: {
        x: 18.5,
        y: 12.5,
        healthFraction: dequantizeRatio(quantizeRatio(0.5)),
        wavesUntilReturn: 0,
      },
      obstacles: [
        { cell: 40, healthFraction: dequantizeRatio(quantizeRatio(0.25)), wrecked: false },
        { cell: 300, healthFraction: 0, wrecked: true },
      ],
      traps: [
        { cell: 41, state: TrapState.Armed },
        { cell: 412, state: TrapState.Holding },
        { cell: 413, state: TrapState.Spent },
      ],
      events: [
        { type: GameEventType.MerchantKilled, killerId: 3 },
        { type: GameEventType.MerchantReturned, reviverId: null },
        { type: GameEventType.MerchantReturned, reviverId: 2 },
        {
          type: GameEventType.EnemyKilled,
          enemyId: 5,
          kind: EnemyKind.Ghost,
          killerId: 1,
          weapon: WeaponId.Spear,
          x: 3.5,
          y: 7.75,
        },
        { type: GameEventType.WaveCleared, wave: 3 },
        {
          type: GameEventType.MeleeSwung,
          attackerId: 1,
          weapon: WeaponId.Warhammer,
          x: 10.5,
          y: 4.25,
          aim: roundTripAngle(1.2),
          reach: 2,
          arcRadians: 1.5,
          furious: true,
          critical: true,
          hits: 3,
        },
        { type: GameEventType.FuryUnleashed, playerId: 1 },
        { type: GameEventType.ObstacleWrecked, cell: 300, attackerId: 2 },
        { type: GameEventType.ObstacleWrecked, cell: 301, attackerId: null },
        { type: GameEventType.ObstacleRestored, cell: 300 },
        { type: GameEventType.TrapArmed, cell: 41, playerId: 1 },
        { type: GameEventType.KegExploded, cell: 41, attackerId: 3 },
        { type: GameEventType.TrapSprung, cell: 412, playerId: null },
        { type: GameEventType.TrapSprung, cell: 412, playerId: 4 },
        {
          type: GameEventType.EnemyKilled,
          enemyId: 9,
          kind: EnemyKind.Zombie,
          killerId: null,
          weapon: null,
          x: 2,
          y: 3,
        },
        { type: GameEventType.EnemyDamaged, enemyId: 9, attackerId: null, amount: 7, x: 2, y: 3 },
      ],
    };
    expect(decodeServerMessage(encodeServerMessage(snapshot))).toEqual(snapshot);
    const withoutPlayers = { ...snapshot, players: [] };
    expect(encodeServerMessage(snapshot).length - encodeServerMessage(withoutPlayers).length).toBe(
      47,
    );
    const player = snapshot.players[0];
    if (player === undefined) {
      throw new Error('Expected player');
    }
    for (const progress of [0, 0.47, 1]) {
      const message = {
        ...snapshot,
        players: [{ ...player, flags: RELOADING, reloadProgress: progress }],
      };
      const decoded = decodeServerMessage(encodeServerMessage(message));
      expect(decoded).toEqual({
        ...message,
        players: [
          {
            ...player,
            flags: RELOADING,
            reloadProgress: dequantizeRatio(quantizeRatio(progress)),
          },
        ],
      });
    }
  });

  it('round-trips scoreboard updates with 16-bit kills', () => {
    const message: ServerMessage = {
      type: ServerMessageType.ScoreboardUpdate,
      players: [{ playerId: 1, score: 70000, kills: 65535, deaths: 12, revives: 3 }],
    };
    expect(decodeServerMessage(encodeServerMessage(message))).toEqual(message);
  });

  it('round-trips a room with bots', () => {
    const message: ServerMessage = {
      type: ServerMessageType.RoomState,
      code: 'ABCD',
      hostId: 1,
      inMatch: false,
      settings: { totalWaves: 15, friendlyFire: false },
      members: [
        { clientId: 1, nickname: 'Пиппин', hero: HeroId.Pippin, ready: false, isBot: false },
        { clientId: 0xff00, nickname: 'Фрося', hero: HeroId.Agatha, ready: true, isBot: true },
      ],
    };
    expect(decodeServerMessage(encodeServerMessage(message))).toEqual(message);
  });

  it('round-trips match settings when resuming', () => {
    const message: ServerMessage = {
      type: ServerMessageType.MatchStarted,
      mapId: 0,
      startTick: 123,
      resumed: true,
      settings: { totalWaves: 20, friendlyFire: false },
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
    expect(() =>
      decodeClientMessage(new Uint8Array([ClientMessageType.SetMatchSettings, 11, 1])),
    ).toThrow(ProtocolError);
    expect(() =>
      decodeClientMessage(new Uint8Array([ClientMessageType.SetMatchSettings, 10, 2])),
    ).toThrow(ProtocolError);
  });
});
