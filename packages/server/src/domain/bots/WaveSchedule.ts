export interface WaveSchedule {
  readonly wave: number;
  readonly isIntermission: boolean;
  voteSkip(playerId: number): void;
}
