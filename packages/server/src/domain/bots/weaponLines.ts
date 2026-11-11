import {
  MELEE_RULES,
  MELEE_WEAPON_IDS,
  MELEE_WEAPONS,
  NEUTRAL_MODIFIERS,
  RANGED_WEAPON_IDS,
  RANGED_WEAPONS,
} from '@graveshift/shared/config';
import type { MeleeWeaponId, RangedWeaponId, UpgradeLevels } from '@graveshift/shared/config';
import { resolveMeleeStats, resolveWeaponStats } from '@graveshift/shared/rules';
import type { WeaponLine } from './WeaponLine.ts';

const PIERCED_TARGET_SHARE = 0.25;
const ALLY_SAFE_ARC_RADIANS = Math.PI;

export const RANGED_LINE: WeaponLine<RangedWeaponId> = {
  weapons: RANGED_WEAPON_IDS,
  rating(weapon, levels) {
    const stats = resolveWeaponStats(RANGED_WEAPONS[weapon], levels, NEUTRAL_MODIFIERS);
    const volley = stats.damage * stats.pellets * (1 + stats.pierce * PIERCED_TARGET_SHARE);
    const cycleSeconds = stats.magazineSize * stats.fireIntervalSeconds + stats.reloadSeconds;
    return (volley * stats.magazineSize) / cycleSeconds;
  },
};

function meleeRating(weapon: MeleeWeaponId, levels: UpgradeLevels): number {
  const stats = resolveMeleeStats(MELEE_WEAPONS[weapon], levels, NEUTRAL_MODIFIERS);
  const critBonus = stats.critChance * (MELEE_RULES.critDamageMultiplier - 1);
  return (stats.damage * (1 + critBonus)) / stats.swingSeconds;
}

const MELEE_LINE: WeaponLine<MeleeWeaponId> = {
  weapons: MELEE_WEAPON_IDS,
  rating: meleeRating,
};

const ALLY_SAFE_MELEE_LINE: WeaponLine<MeleeWeaponId> = {
  weapons: MELEE_WEAPON_IDS.filter(
    (weapon) => MELEE_WEAPONS[weapon].stats.arcRadians <= ALLY_SAFE_ARC_RADIANS,
  ),
  rating: meleeRating,
};

export function meleeLineFor(friendlyFire: boolean): WeaponLine<MeleeWeaponId> {
  return friendlyFire ? ALLY_SAFE_MELEE_LINE : MELEE_LINE;
}
