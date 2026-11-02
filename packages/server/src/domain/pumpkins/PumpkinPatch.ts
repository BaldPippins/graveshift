import type { ReadonlyVec2 } from '@graveshift/shared/core';
import type { PickupEntity } from '../entities/PickupEntity.ts';

export class PumpkinPatch {
  readonly position: ReadonlyVec2;
  pumpkin: PickupEntity | null = null;
  regrowRemainingSeconds = 0;

  constructor(position: ReadonlyVec2) {
    this.position = position;
  }
}
