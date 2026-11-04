import { MELEE_RULES } from '../config/melee.ts';
import type { MeleeStats } from '../config/weapons.ts';

export function furiousMeleeStats(stats: MeleeStats): MeleeStats {
  return {
    ...stats,
    damage: stats.damage * MELEE_RULES.furyDamageMultiplier,
    reach: stats.reach * MELEE_RULES.furyReachMultiplier,
    arcRadians: Math.min(Math.PI * 2, stats.arcRadians * MELEE_RULES.furyArcMultiplier),
  };
}

export function criticalMeleeStats(stats: MeleeStats): MeleeStats {
  return { ...stats, damage: stats.damage * MELEE_RULES.critDamageMultiplier };
}

export function furyChargeFraction(meleeCharge: number): number {
  return Math.min(1, meleeCharge / MELEE_RULES.killsForFury);
}
