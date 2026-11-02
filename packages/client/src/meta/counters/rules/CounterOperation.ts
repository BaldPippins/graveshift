import type { ValueOf } from '@graveshift/shared/core';

export const CounterOperation = {
  Add: 'add',
  Raise: 'raise',
} as const;
export type CounterOperation = ValueOf<typeof CounterOperation>;
