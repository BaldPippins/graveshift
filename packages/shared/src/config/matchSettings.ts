export const WAVE_COUNTS = [10, 15, 20] as const;
export type WaveCount = (typeof WAVE_COUNTS)[number];

export interface MatchSettings {
  readonly totalWaves: WaveCount;
  readonly friendlyFire: boolean;
}

export const DEFAULT_MATCH_SETTINGS: MatchSettings = {
  totalWaves: 10,
  friendlyFire: true,
};
