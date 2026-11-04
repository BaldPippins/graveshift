import { TRAPS } from '@graveshift/shared/config';
import type { TrapDefinition } from '@graveshift/shared/config';
import type { Vec2 } from '@graveshift/shared/core';
import type { TrapSpot } from '@graveshift/shared/rules';
import type { TrapBehavior } from '../traps/TrapBehavior.ts';
import type { Body } from './Body.ts';

export class TrapEntity implements Body {
  readonly id: number;
  readonly spot: TrapSpot;
  readonly definition: TrapDefinition;
  readonly position: Vec2;
  readonly ownerId: number | null;
  readonly power: number;
  readonly behavior: TrapBehavior;

  constructor(spot: TrapSpot, ownerId: number | null, power: number, behavior: TrapBehavior) {
    this.id = spot.index;
    this.spot = spot;
    this.definition = TRAPS[spot.kind];
    this.position = { x: spot.center.x, y: spot.center.y };
    this.ownerId = ownerId;
    this.power = power;
    this.behavior = behavior;
  }

  get radius(): number {
    return this.definition.radius;
  }
}
