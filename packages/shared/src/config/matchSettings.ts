export interface MatchSettings {
  readonly totalWaves: number;
  readonly friendlyFire: boolean;
}

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  totalWaves: 10,
  friendlyFire: true,
};
