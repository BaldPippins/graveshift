import { SCORE_RULES } from '../config/score.ts';
import { fractionOf } from '../core/scalarMath.ts';
import type { PlayerMatchStats } from '../model/PlayerMatchStats.ts';

function accuracyBonus(stats: PlayerMatchStats): number {
  const hitRate = fractionOf(stats.shotsHit, stats.shotsFired);
  const confidence = Math.min(1, stats.shotsFired / SCORE_RULES.shotsForFullAccuracyBonus);
  return SCORE_RULES.accuracyBonus * hitRate * confidence;
}

export function matchScore(stats: PlayerMatchStats): number {
  const score =
    stats.kills * SCORE_RULES.perKill +
    stats.bossKills * SCORE_RULES.perBossKill +
    stats.coinsEarned * SCORE_RULES.perCoinEarned +
    stats.revives * SCORE_RULES.perRevive +
    stats.downs * SCORE_RULES.perDown +
    stats.deaths * SCORE_RULES.perDeath +
    accuracyBonus(stats);
  return Math.max(0, Math.round(score));
}
