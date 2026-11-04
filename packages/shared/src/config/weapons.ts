import type { ValueOf } from '../core/ValueOf.ts';

export const WeaponClass = {
  Ranged: 0,
  Melee: 1,
} as const;
export type WeaponClass = ValueOf<typeof WeaponClass>;

export const RangedWeaponId = {
  Pistol: 0,
  Smg: 1,
  Shotgun: 2,
  Rifle: 3,
  Gatling: 4,
} as const;
export type RangedWeaponId = ValueOf<typeof RangedWeaponId>;
export const RANGED_WEAPON_IDS: readonly RangedWeaponId[] = Object.values(RangedWeaponId);

export const MeleeWeaponId = {
  Shovel: 5,
  Sword: 6,
  Spear: 7,
  Axe: 8,
  Warhammer: 9,
} as const;
export type MeleeWeaponId = ValueOf<typeof MeleeWeaponId>;
export const MELEE_WEAPON_IDS: readonly MeleeWeaponId[] = Object.values(MeleeWeaponId);

export const WeaponId = { ...RangedWeaponId, ...MeleeWeaponId } as const;
export type WeaponId = RangedWeaponId | MeleeWeaponId;
export const WEAPON_IDS: readonly WeaponId[] = [...RANGED_WEAPON_IDS, ...MELEE_WEAPON_IDS];

export interface RangedStats {
  readonly damage: number;
  readonly fireIntervalSeconds: number;
  readonly magazineSize: number;
  readonly reloadSeconds: number;
  readonly pellets: number;
  readonly spreadRadians: number;
  readonly range: number;
  readonly pierce: number;
}

export interface MeleeStats {
  readonly damage: number;
  readonly swingSeconds: number;
  readonly reach: number;
  readonly arcRadians: number;
}

export interface WeaponPricing {
  readonly unlockPrice: number;
  readonly upgradePriceMultiplier: number;
}

export interface RangedWeaponDefinition extends WeaponPricing {
  readonly id: RangedWeaponId;
  readonly weaponClass: typeof WeaponClass.Ranged;
  readonly stats: RangedStats;
}

export interface MeleeWeaponDefinition extends WeaponPricing {
  readonly id: MeleeWeaponId;
  readonly weaponClass: typeof WeaponClass.Melee;
  readonly stats: MeleeStats;
}

export type WeaponDefinition = RangedWeaponDefinition | MeleeWeaponDefinition;

function ranged(
  id: RangedWeaponId,
  stats: RangedStats,
  pricing: WeaponPricing,
): RangedWeaponDefinition {
  return { id, weaponClass: WeaponClass.Ranged, stats, ...pricing };
}

function melee(
  id: MeleeWeaponId,
  stats: MeleeStats,
  pricing: WeaponPricing,
): MeleeWeaponDefinition {
  return { id, weaponClass: WeaponClass.Melee, stats, ...pricing };
}

function degrees(value: number): number {
  return (value * Math.PI) / 180;
}

export const STARTING_RANGED_WEAPON: RangedWeaponId = RangedWeaponId.Pistol;
export const STARTING_MELEE_WEAPON: MeleeWeaponId = MeleeWeaponId.Shovel;
export const STARTING_WEAPONS: readonly WeaponId[] = [
  STARTING_RANGED_WEAPON,
  STARTING_MELEE_WEAPON,
];

export const RANGED_WEAPONS: Readonly<Record<RangedWeaponId, RangedWeaponDefinition>> = {
  [RangedWeaponId.Pistol]: ranged(
    RangedWeaponId.Pistol,
    {
      damage: 19,
      fireIntervalSeconds: 0.26,
      magazineSize: 12,
      reloadSeconds: 1,
      pellets: 1,
      spreadRadians: 0.025,
      range: 14,
      pierce: 0,
    },
    { unlockPrice: 0, upgradePriceMultiplier: 0.7 },
  ),
  [RangedWeaponId.Smg]: ranged(
    RangedWeaponId.Smg,
    {
      damage: 11,
      fireIntervalSeconds: 0.085,
      magazineSize: 32,
      reloadSeconds: 1.5,
      pellets: 1,
      spreadRadians: 0.08,
      range: 12,
      pierce: 0,
    },
    { unlockPrice: 160, upgradePriceMultiplier: 1 },
  ),
  [RangedWeaponId.Shotgun]: ranged(
    RangedWeaponId.Shotgun,
    {
      damage: 13,
      fireIntervalSeconds: 0.75,
      magazineSize: 6,
      reloadSeconds: 1.9,
      pellets: 7,
      spreadRadians: 0.34,
      range: 8,
      pierce: 0,
    },
    { unlockPrice: 230, upgradePriceMultiplier: 1.1 },
  ),
  [RangedWeaponId.Rifle]: ranged(
    RangedWeaponId.Rifle,
    {
      damage: 75,
      fireIntervalSeconds: 0.85,
      magazineSize: 5,
      reloadSeconds: 2.1,
      pellets: 1,
      spreadRadians: 0,
      range: 24,
      pierce: 3,
    },
    { unlockPrice: 320, upgradePriceMultiplier: 1.25 },
  ),
  [RangedWeaponId.Gatling]: ranged(
    RangedWeaponId.Gatling,
    {
      damage: 9,
      fireIntervalSeconds: 0.05,
      magazineSize: 120,
      reloadSeconds: 3,
      pellets: 1,
      spreadRadians: 0.13,
      range: 13,
      pierce: 0,
    },
    { unlockPrice: 480, upgradePriceMultiplier: 1.5 },
  ),
};

export const MELEE_WEAPONS: Readonly<Record<MeleeWeaponId, MeleeWeaponDefinition>> = {
  [MeleeWeaponId.Shovel]: melee(
    MeleeWeaponId.Shovel,
    { damage: 30, swingSeconds: 0.55, reach: 1.25, arcRadians: degrees(100) },
    { unlockPrice: 0, upgradePriceMultiplier: 0.6 },
  ),
  [MeleeWeaponId.Sword]: melee(
    MeleeWeaponId.Sword,
    { damage: 42, swingSeconds: 0.42, reach: 1.4, arcRadians: degrees(110) },
    { unlockPrice: 180, upgradePriceMultiplier: 0.9 },
  ),
  [MeleeWeaponId.Spear]: melee(
    MeleeWeaponId.Spear,
    { damage: 55, swingSeconds: 0.6, reach: 2.2, arcRadians: degrees(40) },
    { unlockPrice: 220, upgradePriceMultiplier: 1 },
  ),
  [MeleeWeaponId.Axe]: melee(
    MeleeWeaponId.Axe,
    { damage: 90, swingSeconds: 0.85, reach: 1.45, arcRadians: degrees(130) },
    { unlockPrice: 300, upgradePriceMultiplier: 1.15 },
  ),
  [MeleeWeaponId.Warhammer]: melee(
    MeleeWeaponId.Warhammer,
    { damage: 120, swingSeconds: 1.1, reach: 1.6, arcRadians: degrees(360) },
    { unlockPrice: 420, upgradePriceMultiplier: 1.35 },
  ),
};

export const WEAPONS: Readonly<Record<WeaponId, WeaponDefinition>> = {
  ...RANGED_WEAPONS,
  ...MELEE_WEAPONS,
};

export function isMeleeWeapon(weapon: WeaponId): weapon is MeleeWeaponId {
  return MELEE_WEAPON_IDS.includes(weapon as MeleeWeaponId);
}

export function isRangedWeapon(weapon: WeaponId): weapon is RangedWeaponId {
  return !isMeleeWeapon(weapon);
}
