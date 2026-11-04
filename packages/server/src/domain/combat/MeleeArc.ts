import type { MeleeSweep } from '@graveshift/shared/rules';

export interface MeleeArc extends MeleeSweep {
  readonly clearance: number;
  readonly viewTick: number;
}
