import { MELEE_RULES } from '../config/melee.ts';
import type { MeleeStats } from '../config/weapons.ts';
import { wrapAngle } from '../core/scalarMath.ts';
import type { ReadonlyVec2 } from '../core/Vec2.ts';

export interface MeleeSweep {
  readonly origin: ReadonlyVec2;
  readonly aim: number;
  readonly reach: number;
  readonly arcRadians: number;
}

const FULL_CIRCLE = Math.PI * 2;

export function isInsideMeleeSweep(
  sweep: MeleeSweep,
  target: ReadonlyVec2,
  radius: number,
): boolean {
  const dx = target.x - sweep.origin.x;
  const dy = target.y - sweep.origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance > sweep.reach + radius) {
    return false;
  }
  if (distance <= radius || sweep.arcRadians >= FULL_CIRCLE) {
    return true;
  }
  const offset = Math.abs(wrapAngle(Math.atan2(dy, dx) - sweep.aim));
  return offset <= sweep.arcRadians / 2 + Math.asin(Math.min(1, radius / distance));
}

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
