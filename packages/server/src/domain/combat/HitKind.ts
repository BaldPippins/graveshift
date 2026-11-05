import type { ValueOf } from '@graveshift/shared/core';

export const HitKind = {
  Enemy: 0,
  Player: 1,
  Merchant: 2,
  Obstacle: 3,
  Trap: 4,
} as const;
export type HitKind = ValueOf<typeof HitKind>;
