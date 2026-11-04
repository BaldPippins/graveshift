import type { ReadonlyVec2 } from '@graveshift/shared/core';

export interface MeleeArc {
  readonly origin: ReadonlyVec2;
  readonly aim: number;
  readonly reach: number;
  readonly arcRadians: number;
  readonly clearance: number;
  readonly viewTick: number;
}
