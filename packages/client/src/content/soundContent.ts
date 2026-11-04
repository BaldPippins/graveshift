import { PickupKind, RangedWeaponId } from '@graveshift/shared/config';
import type { ValueOf } from '@graveshift/shared/core';
import { SoundId } from '../audio/SoundId.ts';
import type { SoundSpec } from '../audio/SoundSpec.ts';

const BASE = `${import.meta.env.BASE_URL}assets/kenney`;

const SoundPack = {
  SciFi: 'sci-fi-sounds',
  Rpg: 'rpg-audio',
  Impact: 'impact-sounds',
  Interface: 'interface-sounds',
} as const;
type SoundPack = ValueOf<typeof SoundPack>;

interface SoundTuning {
  readonly volume: number;
  readonly playbackRate?: number;
  readonly rateJitter?: number;
  readonly minIntervalSeconds?: number;
}

function sound(pack: SoundPack, files: readonly string[], tuning: SoundTuning): SoundSpec {
  return {
    urls: files.map((file) => `${BASE}/${pack}/${file}.mp3`),
    volume: tuning.volume,
    playbackRate: tuning.playbackRate ?? 1,
    rateJitter: tuning.rateJitter ?? 0.05,
    minIntervalSeconds: tuning.minIntervalSeconds ?? 0.05,
  };
}

export const SOUND_CONTENT: Readonly<Record<SoundId, SoundSpec>> = {
  [SoundId.ShotPistol]: sound(SoundPack.SciFi, ['laserSmall_000'], { volume: 0.35 }),
  [SoundId.ShotSmg]: sound(SoundPack.SciFi, ['laserSmall_003'], {
    volume: 0.28,
    playbackRate: 1.25,
    minIntervalSeconds: 0.06,
  }),
  [SoundId.ShotShotgun]: sound(SoundPack.SciFi, ['laserRetro_004'], {
    volume: 0.45,
    playbackRate: 0.75,
  }),
  [SoundId.ShotRifle]: sound(SoundPack.SciFi, ['laserLarge_001'], { volume: 0.35 }),
  [SoundId.ShotGatling]: sound(SoundPack.SciFi, ['laserSmall_001'], {
    volume: 0.22,
    playbackRate: 1.4,
    minIntervalSeconds: 0.07,
  }),
  [SoundId.Reload]: sound(SoundPack.Rpg, ['metalClick'], { volume: 0.5 }),
  [SoundId.MeleeSwing]: sound(SoundPack.Rpg, ['drawKnife1', 'drawKnife2', 'drawKnife3'], {
    volume: 0.45,
    rateJitter: 0.1,
  }),
  [SoundId.MeleeHit]: sound(SoundPack.Rpg, ['chop', 'knifeSlice'], { volume: 0.55 }),
  [SoundId.MeleeCritical]: sound(SoundPack.Impact, ['impactMetal_heavy_000'], { volume: 0.6 }),
  [SoundId.EnemyHit]: sound(SoundPack.Impact, ['impactSoft_medium_000', 'impactSoft_medium_001'], {
    volume: 0.4,
    rateJitter: 0.12,
    minIntervalSeconds: 0.06,
  }),
  [SoundId.EnemyKilled]: sound(SoundPack.SciFi, ['slime_000'], {
    volume: 0.45,
    rateJitter: 0.15,
    minIntervalSeconds: 0.08,
  }),
  [SoundId.PlayerHurt]: sound(SoundPack.Impact, ['impactSoft_heavy_000_muffled'], {
    volume: 0.45,
    playbackRate: 0.9,
    minIntervalSeconds: 0.4,
  }),
  [SoundId.PlayerDowned]: sound(SoundPack.Impact, ['impactBell_heavy_001'], { volume: 0.6 }),
  [SoundId.PlayerRevived]: sound(SoundPack.Interface, ['confirmation_002'], { volume: 0.5 }),
  [SoundId.CoinsPicked]: sound(SoundPack.Rpg, ['handleCoins2'], { volume: 0.5 }),
  [SoundId.HealthPicked]: sound(SoundPack.Interface, ['maximize_006'], { volume: 0.5 }),
  [SoundId.WeaponBought]: sound(SoundPack.Rpg, ['handleCoins'], { volume: 0.6 }),
  [SoundId.WeaponUpgraded]: sound(SoundPack.Rpg, ['metalLatch'], { volume: 0.6 }),
  [SoundId.PurchaseRejected]: sound(SoundPack.Interface, ['error_004'], { volume: 0.5 }),
  [SoundId.ShopOpened]: sound(SoundPack.Rpg, ['bookOpen'], { volume: 0.6 }),
  [SoundId.ShopClosed]: sound(SoundPack.Interface, ['close_002'], { volume: 0.4 }),
  [SoundId.WaveStarted]: sound(SoundPack.Impact, ['impactBell_heavy_000'], {
    volume: 0.6,
    rateJitter: 0,
  }),
  [SoundId.WaveCleared]: sound(SoundPack.Interface, ['confirmation_004'], { volume: 0.5 }),
  [SoundId.MerchantKilled]: sound(SoundPack.SciFi, ['lowFrequency_explosion_001'], {
    volume: 0.7,
  }),
  [SoundId.MerchantReturned]: sound(SoundPack.Rpg, ['doorOpen_1'], { volume: 0.6 }),
  [SoundId.FuryUnleashed]: sound(SoundPack.SciFi, ['forceField_000'], { volume: 0.6 }),
  [SoundId.AchievementUnlocked]: sound(SoundPack.Interface, ['confirmation_001'], {
    volume: 0.5,
  }),
};

export const SHOT_SOUNDS: Readonly<Record<RangedWeaponId, SoundId>> = {
  [RangedWeaponId.Pistol]: SoundId.ShotPistol,
  [RangedWeaponId.Smg]: SoundId.ShotSmg,
  [RangedWeaponId.Shotgun]: SoundId.ShotShotgun,
  [RangedWeaponId.Rifle]: SoundId.ShotRifle,
  [RangedWeaponId.Gatling]: SoundId.ShotGatling,
};

export const PICKUP_SOUNDS: Readonly<Record<PickupKind, SoundId>> = {
  [PickupKind.Coins]: SoundId.CoinsPicked,
  [PickupKind.Heart]: SoundId.HealthPicked,
  [PickupKind.Pumpkin]: SoundId.HealthPicked,
};
