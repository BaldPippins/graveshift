import type { TracerMotion } from './TracerMotion.ts';
import type { TracerSegment } from './TracerSegment.ts';

export class FadingBeam implements TracerMotion {
  readonly lifetimeSeconds: number;

  constructor(lifetimeSeconds: number) {
    this.lifetimeSeconds = lifetimeSeconds;
  }

  place(segment: TracerSegment, totalLength: number): void {
    segment.start = 0;
    segment.length = totalLength;
  }

  opacityAt(progress: number): number {
    return 1 - progress;
  }
}
