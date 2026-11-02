import type { ValueOf } from '../core/ValueOf.ts';

export const LifeState = {
  Alive: 0,
  Downed: 1,
  Dead: 2,
} as const;
export type LifeState = ValueOf<typeof LifeState>;
export const LIFE_STATES: readonly LifeState[] = Object.values(LifeState);
