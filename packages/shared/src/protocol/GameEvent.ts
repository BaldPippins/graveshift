import type { EnemyKind } from '../config/enemies.ts';
import type { PickupKind } from '../config/pickups.ts';
import type { UpgradeStat } from '../config/upgrades.ts';
import type { MeleeWeaponId, RangedWeaponId, WeaponId } from '../config/weapons.ts';
import type { ValueOf } from '../core/ValueOf.ts';

export const GameEventType = {
  ShotFired: 0,
  EnemyDamaged: 1,
  EnemyKilled: 2,
  PlayerDamaged: 3,
  PlayerDowned: 4,
  PlayerRevived: 5,
  PlayerDied: 6,
  PlayerRespawned: 7,
  CoinsEarned: 8,
  CoinsSpent: 9,
  PickupCollected: 10,
  WaveStarted: 11,
  WaveCleared: 12,
  WeaponUnlocked: 13,
  WeaponUpgraded: 14,
  PlayerHealed: 15,
  MerchantKilled: 16,
  MerchantReturned: 17,
  MeleeSwung: 18,
  FuryUnleashed: 19,
  ObstacleWrecked: 20,
  ObstacleRestored: 21,
  TrapArmed: 22,
  KegExploded: 23,
  TrapSprung: 24,
} as const;
export type GameEventType = ValueOf<typeof GameEventType>;
export const GAME_EVENT_TYPES: readonly GameEventType[] = Object.values(GameEventType);

export interface ShotFiredEvent {
  readonly type: typeof GameEventType.ShotFired;
  readonly shooterId: number;
  readonly weapon: RangedWeaponId;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly hit: boolean;
}

export interface EnemyDamagedEvent {
  readonly type: typeof GameEventType.EnemyDamaged;
  readonly enemyId: number;
  readonly attackerId: number | null;
  readonly amount: number;
  readonly x: number;
  readonly y: number;
}

export interface EnemyKilledEvent {
  readonly type: typeof GameEventType.EnemyKilled;
  readonly enemyId: number;
  readonly kind: EnemyKind;
  readonly killerId: number | null;
  readonly weapon: WeaponId | null;
  readonly x: number;
  readonly y: number;
}

export interface PlayerDamagedEvent {
  readonly type: typeof GameEventType.PlayerDamaged;
  readonly playerId: number;
  readonly amount: number;
  readonly attackerId: number | null;
}

export interface PlayerDownedEvent {
  readonly type: typeof GameEventType.PlayerDowned;
  readonly playerId: number;
}

export interface PlayerRevivedEvent {
  readonly type: typeof GameEventType.PlayerRevived;
  readonly playerId: number;
  readonly reviverId: number;
}

export interface PlayerDiedEvent {
  readonly type: typeof GameEventType.PlayerDied;
  readonly playerId: number;
}

export interface PlayerRespawnedEvent {
  readonly type: typeof GameEventType.PlayerRespawned;
  readonly playerId: number;
}

export interface CoinsEarnedEvent {
  readonly type: typeof GameEventType.CoinsEarned;
  readonly playerId: number;
  readonly amount: number;
}

export interface CoinsSpentEvent {
  readonly type: typeof GameEventType.CoinsSpent;
  readonly playerId: number;
  readonly amount: number;
}

export interface PickupCollectedEvent {
  readonly type: typeof GameEventType.PickupCollected;
  readonly playerId: number;
  readonly kind: PickupKind;
  readonly amount: number;
}

export interface WaveStartedEvent {
  readonly type: typeof GameEventType.WaveStarted;
  readonly wave: number;
}

export interface WaveClearedEvent {
  readonly type: typeof GameEventType.WaveCleared;
  readonly wave: number;
}

export interface WeaponUnlockedEvent {
  readonly type: typeof GameEventType.WeaponUnlocked;
  readonly playerId: number;
  readonly weapon: WeaponId;
}

export interface WeaponUpgradedEvent {
  readonly type: typeof GameEventType.WeaponUpgraded;
  readonly playerId: number;
  readonly weapon: WeaponId;
  readonly stat: UpgradeStat;
  readonly level: number;
}

export interface PlayerHealedEvent {
  readonly type: typeof GameEventType.PlayerHealed;
  readonly playerId: number;
  readonly amount: number;
}

export interface MerchantKilledEvent {
  readonly type: typeof GameEventType.MerchantKilled;
  readonly killerId: number | null;
}

export interface MerchantReturnedEvent {
  readonly type: typeof GameEventType.MerchantReturned;
  readonly reviverId: number | null;
}

export interface MeleeSwungEvent {
  readonly type: typeof GameEventType.MeleeSwung;
  readonly attackerId: number;
  readonly weapon: MeleeWeaponId;
  readonly x: number;
  readonly y: number;
  readonly aim: number;
  readonly reach: number;
  readonly arcRadians: number;
  readonly furious: boolean;
  readonly critical: boolean;
  readonly hits: number;
}

export interface FuryUnleashedEvent {
  readonly type: typeof GameEventType.FuryUnleashed;
  readonly playerId: number;
}

export interface ObstacleWreckedEvent {
  readonly type: typeof GameEventType.ObstacleWrecked;
  readonly cell: number;
  readonly attackerId: number | null;
}

export interface ObstacleRestoredEvent {
  readonly type: typeof GameEventType.ObstacleRestored;
  readonly cell: number;
}

export interface TrapArmedEvent {
  readonly type: typeof GameEventType.TrapArmed;
  readonly cell: number;
  readonly playerId: number;
}

export interface KegExplodedEvent {
  readonly type: typeof GameEventType.KegExploded;
  readonly cell: number;
  readonly attackerId: number;
}

export interface TrapSprungEvent {
  readonly type: typeof GameEventType.TrapSprung;
  readonly cell: number;
  readonly playerId: number | null;
}

export type GameEvent =
  | ShotFiredEvent
  | EnemyDamagedEvent
  | EnemyKilledEvent
  | PlayerDamagedEvent
  | PlayerDownedEvent
  | PlayerRevivedEvent
  | PlayerDiedEvent
  | PlayerRespawnedEvent
  | CoinsEarnedEvent
  | CoinsSpentEvent
  | PickupCollectedEvent
  | WaveStartedEvent
  | WaveClearedEvent
  | WeaponUnlockedEvent
  | WeaponUpgradedEvent
  | PlayerHealedEvent
  | MerchantKilledEvent
  | MerchantReturnedEvent
  | MeleeSwungEvent
  | FuryUnleashedEvent
  | ObstacleWreckedEvent
  | ObstacleRestoredEvent
  | TrapArmedEvent
  | KegExplodedEvent
  | TrapSprungEvent;
