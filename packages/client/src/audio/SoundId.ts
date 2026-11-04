import type { ValueOf } from '@graveshift/shared/core';

export const SoundId = {
  ShotPistol: 'shot-pistol',
  ShotSmg: 'shot-smg',
  ShotShotgun: 'shot-shotgun',
  ShotRifle: 'shot-rifle',
  ShotGatling: 'shot-gatling',
  Reload: 'reload',
  MeleeSwing: 'melee-swing',
  MeleeHit: 'melee-hit',
  MeleeCritical: 'melee-critical',
  EnemyHit: 'enemy-hit',
  EnemyKilled: 'enemy-killed',
  PlayerHurt: 'player-hurt',
  PlayerDowned: 'player-downed',
  PlayerRevived: 'player-revived',
  CoinsPicked: 'coins-picked',
  HealthPicked: 'health-picked',
  WeaponBought: 'weapon-bought',
  WeaponUpgraded: 'weapon-upgraded',
  PurchaseRejected: 'purchase-rejected',
  ShopOpened: 'shop-opened',
  ShopClosed: 'shop-closed',
  WaveStarted: 'wave-started',
  WaveCleared: 'wave-cleared',
  MerchantKilled: 'merchant-killed',
  MerchantReturned: 'merchant-returned',
  FuryUnleashed: 'fury-unleashed',
  AchievementUnlocked: 'achievement-unlocked',
} as const;
export type SoundId = ValueOf<typeof SoundId>;
export const SOUND_IDS: readonly SoundId[] = Object.values(SoundId);
