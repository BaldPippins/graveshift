import type { MatchOutcome } from './MatchOutcome.ts';
import type { PlayerMatchStats } from './PlayerMatchStats.ts';

export interface MatchSummary {
  readonly outcome: MatchOutcome;
  readonly wave: number;
  readonly durationTicks: number;
  readonly stats: readonly PlayerMatchStats[];
}
