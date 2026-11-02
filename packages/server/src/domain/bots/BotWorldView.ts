import type { ReadonlyVec2 } from '@graveshift/shared/core';
import type { LifeState } from '@graveshift/shared/model';

export interface BotTeammate {
  readonly position: ReadonlyVec2;
  readonly life: LifeState;
  readonly isHuman: boolean;
}

export interface BotWorldView {
  readonly self: ReadonlyVec2;
  readonly teammates: readonly BotTeammate[];
  readonly enemies: readonly ReadonlyVec2[];
  readonly merchant: ReadonlyVec2 | null;
  readonly needsShopping: boolean;
}
