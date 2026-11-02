import type { Vec2 } from '@graveshift/shared/core';

export interface Body {
  readonly id: number;
  readonly position: Vec2;
  readonly radius: number;
}
