import type { ReadonlyVec2 } from '@graveshift/shared/core';

export interface RearmRequest {
  readonly botId: number;
  readonly wave: number;
  readonly tick: number;
  readonly position: ReadonlyVec2;
  readonly coins: number;
}
