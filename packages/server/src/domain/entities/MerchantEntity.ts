import { MERCHANT_RULES } from '@graveshift/shared/config';
import type { ReadonlyVec2, Vec2 } from '@graveshift/shared/core';
import type { Body } from './Body.ts';

const MERCHANT_BODY_ID = 0;

export class MerchantEntity implements Body {
  readonly id = MERCHANT_BODY_ID;
  readonly position: Vec2;
  readonly maxHealth = MERCHANT_RULES.maxHealth;
  health: number = MERCHANT_RULES.maxHealth;
  wavesUntilReturn = 0;

  constructor(position: ReadonlyVec2) {
    this.position = { x: position.x, y: position.y };
  }

  get radius(): number {
    return MERCHANT_RULES.radius;
  }

  get isAlive(): boolean {
    return this.health > 0;
  }
}
