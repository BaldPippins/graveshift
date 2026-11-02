import type { ValueOf } from '../core/ValueOf.ts';

export const MatchOutcome = {
  Victory: 0,
  Defeat: 1,
  Abandoned: 2,
} as const;
export type MatchOutcome = ValueOf<typeof MatchOutcome>;
export const MATCH_OUTCOMES: readonly MatchOutcome[] = Object.values(MatchOutcome);
