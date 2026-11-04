import type { ValueOf } from '@graveshift/shared/core';

export const HowToTab = {
  Controls: 'controls',
  Shift: 'shift',
  Combat: 'combat',
  Bestiary: 'bestiary',
} as const;
export type HowToTab = ValueOf<typeof HowToTab>;
