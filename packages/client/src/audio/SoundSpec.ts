export interface SoundSpec {
  readonly urls: readonly string[];
  readonly volume: number;
  readonly playbackRate: number;
  readonly rateJitter: number;
  readonly minIntervalSeconds: number;
}
