import type { BlastSpec } from '@graveshift/shared/config';
import type { ReadonlyVec2 } from '@graveshift/shared/core';

export interface Blast {
  readonly center: ReadonlyVec2;
  readonly spec: BlastSpec;
}
