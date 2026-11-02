import type { ValueOf } from '../core/ValueOf.ts';

export const WeaponId = {
  Pistol: 0,
  Smg: 1,
  Shotgun: 2,
  Rifle: 3,
  Gatling: 4,
} as const;
export type WeaponId = ValueOf<typeof WeaponId>;
export const WEAPON_IDS: readonly WeaponId[] = Object.values(WeaponId);

export interface WeaponStats {
  readonly damage: number;
  readonly fireIntervalSeconds: number;
  readonly magazineSize: number;
  readonly reloadSeconds: number;
  readonly pellets: number;
  readonly spreadRadians: number;
  readonly range: number;
  readonly pierce: number;
}

export interface WeaponDefinition {
  readonly id: WeaponId;
  readonly stats: WeaponStats;
  readonly unlockPrice: number;
  readonly upgradePriceMultiplier: number;
}

export const STARTING_WEAPON: WeaponId = WeaponId.Pistol;

export const WEAPONS: Readonly<Record<WeaponId, WeaponDefinition>> = {
  [WeaponId.Pistol]: {
    id: WeaponId.Pistol,
    stats: {
      damage: 19,
      fireIntervalSeconds: 0.26,
      magazineSize: 12,
      reloadSeconds: 1,
      pellets: 1,
      spreadRadians: 0.025,
      range: 14,
      pierce: 0,
    },
    unlockPrice: 0,
    upgradePriceMultiplier: 0.7,
  },
  [WeaponId.Smg]: {
    id: WeaponId.Smg,
    stats: {
      damage: 11,
      fireIntervalSeconds: 0.085,
      magazineSize: 32,
      reloadSeconds: 1.5,
      pellets: 1,
      spreadRadians: 0.08,
      range: 12,
      pierce: 0,
    },
    unlockPrice: 160,
    upgradePriceMultiplier: 1,
  },
  [WeaponId.Shotgun]: {
    id: WeaponId.Shotgun,
    stats: {
      damage: 13,
      fireIntervalSeconds: 0.75,
      magazineSize: 6,
      reloadSeconds: 1.9,
      pellets: 7,
      spreadRadians: 0.34,
      range: 8,
      pierce: 0,
    },
    unlockPrice: 230,
    upgradePriceMultiplier: 1.1,
  },
  [WeaponId.Rifle]: {
    id: WeaponId.Rifle,
    stats: {
      damage: 75,
      fireIntervalSeconds: 0.85,
      magazineSize: 5,
      reloadSeconds: 2.1,
      pellets: 1,
      spreadRadians: 0,
      range: 24,
      pierce: 3,
    },
    unlockPrice: 320,
    upgradePriceMultiplier: 1.25,
  },
  [WeaponId.Gatling]: {
    id: WeaponId.Gatling,
    stats: {
      damage: 9,
      fireIntervalSeconds: 0.05,
      magazineSize: 120,
      reloadSeconds: 3,
      pellets: 1,
      spreadRadians: 0.13,
      range: 13,
      pierce: 0,
    },
    unlockPrice: 480,
    upgradePriceMultiplier: 1.5,
  },
};
