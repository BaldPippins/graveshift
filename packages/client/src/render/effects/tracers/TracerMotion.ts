import type { TracerSegment } from './TracerSegment.ts';

export interface TracerMotion {
  readonly lifetimeSeconds: number;
  place(segment: TracerSegment, totalLength: number, progress: number): void;
  opacityAt(progress: number): number;
}
