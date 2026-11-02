import type { MatchOutcome } from '@graveshift/shared/model';

export interface SmokeReport {
  readonly name: string;
  kills: number;
  shots: number;
  maxWave: number;
  purchases: number;
  revives: number;
  snapshots: number;
  stalls: number;
  outcome: MatchOutcome | null;
}
