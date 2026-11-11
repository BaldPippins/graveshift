import {
  MELEE_RULES,
  MELEE_WEAPON_IDS,
  MELEE_WEAPONS,
  NEUTRAL_MODIFIERS,
  RANGED_WEAPON_IDS,
  RANGED_WEAPONS,
} from '@graveshift/shared/config';
import type { MeleeWeaponId, RangedWeaponId } from '@graveshift/shared/config';
import { resolveMeleeStats, resolveWeaponStats } from '@graveshift/shared/rules';
import type { WeaponLine } from './WeaponLine.ts';

const PIERCED_TARGET_SHARE = 0.25;

export const RANGED_LINE: WeaponLine<RangedWeaponId> = {
  weapons: RANGED_WEAPON_IDS,
  rating(weapon, levels) {
    const stats = resolveWeaponStats(RANGED_WEAPONS[weapon], levels, NEUTRAL_MODIFIERS);
    const volley = stats.damage * stats.pellets * (1 + stats.pierce * PIERCED_TARGET_SHARE);
    const cycleSeconds = stats.magazineSize * stats.fireIntervalSeconds + stats.reloadSeconds;
    return (volley * stats.magazineSize) / cycleSeconds;
  },
};

export const MELEE_LINE: WeaponLine<MeleeWeaponId> = {
  weapons: MELEE_WEAPON_IDS,
  rating(weapon, levels) {
    const stats = resolveMeleeStats(MELEE_WEAPONS[weapon], levels, NEUTRAL_MODIFIERS);
    const critBonus = stats.critChance * (MELEE_RULES.critDamageMultiplier - 1);
    return (stats.damage * (1 + critBonus)) / stats.swingSeconds;
  },
};
