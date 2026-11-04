import { PLAYER_RULES } from '../config/player.ts';

export function reviveRate(speedMultipliers: readonly number[]): number {
  if (speedMultipliers.length === 0) {
    return 0;
  }
  const helpers = speedMultipliers.length - 1;
  return Math.max(...speedMultipliers) * (1 + PLAYER_RULES.reviveHelperBonus * helpers);
}
