import { ENEMY_KINDS } from '../../config/enemies.ts';
import { PICKUP_KINDS } from '../../config/pickups.ts';
import { UPGRADE_STATS } from '../../config/upgrades.ts';
import { MELEE_WEAPON_IDS, RANGED_WEAPON_IDS, WEAPON_IDS } from '../../config/weapons.ts';
import { dequantizeAngle, quantizeAngle } from '../quantization.ts';
import { GAME_EVENT_TYPES, GameEventType } from '../GameEvent.ts';
import type { GameEvent } from '../GameEvent.ts';
import { createUnionCodec } from './createUnionCodec.ts';
import type { CodecRegistry } from './createUnionCodec.ts';

const GAME_EVENT_CODECS: CodecRegistry<GameEvent> = {
  [GameEventType.ShotFired]: {
    write: (w, e) =>
      w.u16(e.shooterId).u8(e.weapon).f32(e.fromX).f32(e.fromY).f32(e.toX).f32(e.toY).bool(e.hit),
    read: (r) => ({
      type: GameEventType.ShotFired,
      shooterId: r.u16(),
      weapon: r.oneOf(RANGED_WEAPON_IDS),
      fromX: r.f32(),
      fromY: r.f32(),
      toX: r.f32(),
      toY: r.f32(),
      hit: r.bool(),
    }),
  },
  [GameEventType.EnemyDamaged]: {
    write: (w, e) => w.u16(e.enemyId).u16(e.attackerId).u16(Math.round(e.amount)).f32(e.x).f32(e.y),
    read: (r) => ({
      type: GameEventType.EnemyDamaged,
      enemyId: r.u16(),
      attackerId: r.u16(),
      amount: r.u16(),
      x: r.f32(),
      y: r.f32(),
    }),
  },
  [GameEventType.EnemyKilled]: {
    write: (w, e) => w.u16(e.enemyId).u8(e.kind).u16(e.killerId).u8(e.weapon).f32(e.x).f32(e.y),
    read: (r) => ({
      type: GameEventType.EnemyKilled,
      enemyId: r.u16(),
      kind: r.oneOf(ENEMY_KINDS),
      killerId: r.u16(),
      weapon: r.oneOf(WEAPON_IDS),
      x: r.f32(),
      y: r.f32(),
    }),
  },
  [GameEventType.PlayerDamaged]: {
    write: (w, e) => {
      w.u16(e.playerId)
        .u16(Math.round(e.amount))
        .bool(e.attackerId !== null);
      if (e.attackerId !== null) {
        w.u16(e.attackerId);
      }
    },
    read: (r) => ({
      type: GameEventType.PlayerDamaged,
      playerId: r.u16(),
      amount: r.u16(),
      attackerId: r.bool() ? r.u16() : null,
    }),
  },
  [GameEventType.PlayerDowned]: {
    write: (w, e) => w.u16(e.playerId),
    read: (r) => ({ type: GameEventType.PlayerDowned, playerId: r.u16() }),
  },
  [GameEventType.PlayerRevived]: {
    write: (w, e) => w.u16(e.playerId).u16(e.reviverId),
    read: (r) => ({ type: GameEventType.PlayerRevived, playerId: r.u16(), reviverId: r.u16() }),
  },
  [GameEventType.PlayerDied]: {
    write: (w, e) => w.u16(e.playerId),
    read: (r) => ({ type: GameEventType.PlayerDied, playerId: r.u16() }),
  },
  [GameEventType.PlayerRespawned]: {
    write: (w, e) => w.u16(e.playerId),
    read: (r) => ({ type: GameEventType.PlayerRespawned, playerId: r.u16() }),
  },
  [GameEventType.CoinsEarned]: {
    write: (w, e) => w.u16(e.playerId).u32(e.amount),
    read: (r) => ({ type: GameEventType.CoinsEarned, playerId: r.u16(), amount: r.u32() }),
  },
  [GameEventType.CoinsSpent]: {
    write: (w, e) => w.u16(e.playerId).u32(e.amount),
    read: (r) => ({ type: GameEventType.CoinsSpent, playerId: r.u16(), amount: r.u32() }),
  },
  [GameEventType.PickupCollected]: {
    write: (w, e) => w.u16(e.playerId).u8(e.kind).u16(e.amount),
    read: (r) => ({
      type: GameEventType.PickupCollected,
      playerId: r.u16(),
      kind: r.oneOf(PICKUP_KINDS),
      amount: r.u16(),
    }),
  },
  [GameEventType.WaveStarted]: {
    write: (w, e) => w.u8(e.wave),
    read: (r) => ({ type: GameEventType.WaveStarted, wave: r.u8() }),
  },
  [GameEventType.WaveCleared]: {
    write: (w, e) => w.u8(e.wave),
    read: (r) => ({ type: GameEventType.WaveCleared, wave: r.u8() }),
  },
  [GameEventType.WeaponUnlocked]: {
    write: (w, e) => w.u16(e.playerId).u8(e.weapon),
    read: (r) => ({
      type: GameEventType.WeaponUnlocked,
      playerId: r.u16(),
      weapon: r.oneOf(WEAPON_IDS),
    }),
  },
  [GameEventType.WeaponUpgraded]: {
    write: (w, e) => w.u16(e.playerId).u8(e.weapon).u8(e.stat).u8(e.level),
    read: (r) => ({
      type: GameEventType.WeaponUpgraded,
      playerId: r.u16(),
      weapon: r.oneOf(WEAPON_IDS),
      stat: r.oneOf(UPGRADE_STATS),
      level: r.u8(),
    }),
  },
  [GameEventType.PlayerHealed]: {
    write: (w, e) => w.u16(e.playerId).u16(Math.round(e.amount)),
    read: (r) => ({ type: GameEventType.PlayerHealed, playerId: r.u16(), amount: r.u16() }),
  },
  [GameEventType.MerchantKilled]: {
    write: (w, e) => {
      w.bool(e.killerId !== null);
      if (e.killerId !== null) {
        w.u16(e.killerId);
      }
    },
    read: (r) => ({ type: GameEventType.MerchantKilled, killerId: r.bool() ? r.u16() : null }),
  },
  [GameEventType.MerchantReturned]: {
    write: (w, e) => {
      w.bool(e.reviverId !== null);
      if (e.reviverId !== null) {
        w.u16(e.reviverId);
      }
    },
    read: (r) => ({ type: GameEventType.MerchantReturned, reviverId: r.bool() ? r.u16() : null }),
  },
  [GameEventType.MeleeSwung]: {
    write: (w, e) =>
      w
        .u16(e.attackerId)
        .u8(e.weapon)
        .f32(e.x)
        .f32(e.y)
        .u16(quantizeAngle(e.aim))
        .f32(e.reach)
        .f32(e.arcRadians)
        .bool(e.furious)
        .bool(e.critical)
        .u8(Math.min(255, e.hits)),
    read: (r) => ({
      type: GameEventType.MeleeSwung,
      attackerId: r.u16(),
      weapon: r.oneOf(MELEE_WEAPON_IDS),
      x: r.f32(),
      y: r.f32(),
      aim: dequantizeAngle(r.u16()),
      reach: r.f32(),
      arcRadians: r.f32(),
      furious: r.bool(),
      critical: r.bool(),
      hits: r.u8(),
    }),
  },
  [GameEventType.FuryUnleashed]: {
    write: (w, e) => w.u16(e.playerId),
    read: (r) => ({ type: GameEventType.FuryUnleashed, playerId: r.u16() }),
  },
};

export const gameEventCodec = createUnionCodec(GAME_EVENT_CODECS, GAME_EVENT_TYPES);
