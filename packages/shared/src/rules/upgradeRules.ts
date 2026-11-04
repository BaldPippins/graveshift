import type { HeroModifiers } from '../config/heroes.ts';
import { UPGRADES, UpgradeStat } from '../config/upgrades.ts';
import type { UpgradeLevels } from '../config/upgrades.ts';
import { MELEE_RULES } from '../config/melee.ts';
import type {
  MeleeStats,
  MeleeWeaponDefinition,
  RangedStats,
  RangedWeaponDefinition,
  WeaponPricing,
} from '../config/weapons.ts';

export function upgradePrice(
  weapon: WeaponPricing,
  stat: UpgradeStat,
  currentLevel: number,
): number {
  const upgrade = UPGRADES[stat];
  return Math.round(
    upgrade.basePrice * upgrade.priceGrowth ** currentLevel * weapon.upgradePriceMultiplier,
  );
}

export function isUpgradeMaxed(stat: UpgradeStat, level: number): boolean {
  return level >= UPGRADES[stat].maxLevel;
}

function upgradeBonus(stat: UpgradeStat, levels: UpgradeLevels): number {
  return 1 + UPGRADES[stat].effectPerLevel * levels[stat];
}

export function resolveMeleeStats(
  weapon: MeleeWeaponDefinition,
  levels: UpgradeLevels,
  modifiers: HeroModifiers,
): MeleeStats {
  const base = weapon.stats;
  return {
    damage: base.damage * upgradeBonus(UpgradeStat.Damage, levels) * modifiers.damageMultiplier,
    swingSeconds:
      base.swingSeconds /
      (upgradeBonus(UpgradeStat.FireRate, levels) * modifiers.fireRateMultiplier),
    reach: base.reach,
    arcRadians: base.arcRadians,
    critChance:
      base.critChance + MELEE_RULES.critChancePerUpgradeLevel * levels[UpgradeStat.Capacity],
  };
}

export function resolveWeaponStats(
  weapon: RangedWeaponDefinition,
  levels: UpgradeLevels,
  modifiers: HeroModifiers,
): RangedStats {
  const base = weapon.stats;
  const capacityBonus = upgradeBonus(UpgradeStat.Capacity, levels);
  return {
    ...base,
    damage: base.damage * upgradeBonus(UpgradeStat.Damage, levels) * modifiers.damageMultiplier,
    fireIntervalSeconds:
      base.fireIntervalSeconds /
      (upgradeBonus(UpgradeStat.FireRate, levels) * modifiers.fireRateMultiplier),
    magazineSize: Math.round(base.magazineSize * capacityBonus),
    reloadSeconds: base.reloadSeconds / Math.sqrt(capacityBonus),
  };
}
