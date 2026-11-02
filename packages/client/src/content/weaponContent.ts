import { UpgradeStat, WeaponId } from '@graveshift/shared/config';
import { ModelKey } from '../assets/ModelKey.ts';

export interface WeaponContent {
  readonly model: ModelKey;
  readonly tracerColor: number;
}

export const WEAPON_CONTENT: Readonly<Record<WeaponId, WeaponContent>> = {
  [WeaponId.Pistol]: {
    model: ModelKey.Pistol,
    tracerColor: 0xffe08a,
  },
  [WeaponId.Smg]: {
    model: ModelKey.Smg,
    tracerColor: 0xffb347,
  },
  [WeaponId.Shotgun]: {
    model: ModelKey.Shotgun,
    tracerColor: 0xff7b54,
  },
  [WeaponId.Rifle]: {
    model: ModelKey.Rifle,
    tracerColor: 0x9fe7ff,
  },
  [WeaponId.Gatling]: {
    model: ModelKey.Gatling,
    tracerColor: 0xb3ff8a,
  },
};

export const UPGRADE_ICONS: Readonly<Record<UpgradeStat, string>> = {
  [UpgradeStat.Damage]: '💥',
  [UpgradeStat.FireRate]: '⚡',
  [UpgradeStat.Capacity]: '📦',
};
