import type { ValueOf } from '../core/ValueOf.ts';

export const UpgradeStat = {
  Damage: 0,
  FireRate: 1,
  Capacity: 2,
} as const;
export type UpgradeStat = ValueOf<typeof UpgradeStat>;
export const UPGRADE_STATS: readonly UpgradeStat[] = Object.values(UpgradeStat);

export type UpgradeLevels = Readonly<Record<UpgradeStat, number>>;

export interface UpgradeDefinition {
  readonly stat: UpgradeStat;
  readonly maxLevel: number;
  readonly basePrice: number;
  readonly priceGrowth: number;
  readonly effectPerLevel: number;
}

export const UPGRADES: Readonly<Record<UpgradeStat, UpgradeDefinition>> = {
  [UpgradeStat.Damage]: {
    stat: UpgradeStat.Damage,
    maxLevel: 3,
    basePrice: 90,
    priceGrowth: 1.7,
    effectPerLevel: 0.22,
  },
  [UpgradeStat.FireRate]: {
    stat: UpgradeStat.FireRate,
    maxLevel: 3,
    basePrice: 80,
    priceGrowth: 1.7,
    effectPerLevel: 0.14,
  },
  [UpgradeStat.Capacity]: {
    stat: UpgradeStat.Capacity,
    maxLevel: 3,
    basePrice: 60,
    priceGrowth: 1.6,
    effectPerLevel: 0.3,
  },
};

export const NO_UPGRADES: UpgradeLevels = Object.fromEntries(
  UPGRADE_STATS.map((stat) => [stat, 0]),
) as Record<UpgradeStat, number>;
