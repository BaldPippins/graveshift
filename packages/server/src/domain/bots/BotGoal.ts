import type { ValueOf } from '@graveshift/shared/core';

export const BotGoal = {
  Hold: 0,
  Revive: 1,
  Hunt: 2,
  Follow: 3,
  Errand: 4,
  Heal: 5,
} as const;
export type BotGoal = ValueOf<typeof BotGoal>;
