import type { Body } from '../entities/Body.ts';

export interface HistoryFrame {
  readonly tick: number;
  readonly offsets: ReadonlyMap<Body, number>;
  readonly coordinates: Float32Array;
}
