import type { TracerMotion } from './TracerMotion.ts';
import type { TracerSegment } from './TracerSegment.ts';

export class FlyingBolt implements TracerMotion {
  readonly lifetimeSeconds: number;
  private readonly boltLength: number;

  constructor(lifetimeSeconds: number, boltLength: number) {
    this.lifetimeSeconds = lifetimeSeconds;
    this.boltLength = boltLength;
  }

  place(segment: TracerSegment, totalLength: number, progress: number): void {
    segment.length = Math.min(this.boltLength, totalLength);
    segment.start = (totalLength - segment.length) * progress;
  }

  opacityAt(): number {
    return 1;
  }
}
