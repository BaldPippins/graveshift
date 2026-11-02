import type { ValueOf } from '../core/ValueOf.ts';

export const MatchPhase = {
  Countdown: 0,
  Combat: 1,
  Intermission: 2,
  Victory: 3,
  Defeat: 4,
} as const;
export type MatchPhase = ValueOf<typeof MatchPhase>;
export const MATCH_PHASES: readonly MatchPhase[] = Object.values(MatchPhase);
