import type { ValueOf } from '../core/ValueOf.ts';

export const TrapState = {
  Armed: 0,
  Holding: 1,
  Spent: 2,
} as const;
export type TrapState = ValueOf<typeof TrapState>;
export const TRAP_STATES: readonly TrapState[] = Object.values(TrapState);
