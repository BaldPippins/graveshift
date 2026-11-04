import type { AchievementId } from '../../meta/achievements/AchievementId.ts';
import type { MatchOutcome, PlayerMatchStats } from '@graveshift/shared/model';

export interface MatchResult {
  readonly outcome: MatchOutcome;
  readonly wave: number;
  readonly totalWaves: number;
  readonly durationSeconds: number;
  readonly stats: readonly PlayerMatchStats[];
  readonly localPlayerId: number;
  readonly unlockedAchievements: readonly AchievementId[];
}
