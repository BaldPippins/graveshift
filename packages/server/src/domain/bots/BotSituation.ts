import type { ReadonlyVec2 } from '@graveshift/shared/core';

export interface BotSituation {
  readonly self: ReadonlyVec2;
  readonly allies: readonly ReadonlyVec2[];
  readonly downedAllies: readonly ReadonlyVec2[];
  readonly enemies: readonly ReadonlyVec2[];
  readonly heals: readonly ReadonlyVec2[];
  readonly healthFraction: number;
  readonly leader: ReadonlyVec2 | null;
  readonly errand: ReadonlyVec2 | null;
}
