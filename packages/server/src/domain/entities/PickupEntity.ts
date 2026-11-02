import type { PickupDefinition } from '@graveshift/shared/config';
import type { Vec2 } from '@graveshift/shared/core';

export class PickupEntity {
  readonly id: number;
  readonly definition: PickupDefinition;
  readonly position: Vec2;
  remainingSeconds: number;

  constructor(id: number, definition: PickupDefinition, position: Vec2) {
    this.id = id;
    this.definition = definition;
    this.position = position;
    this.remainingSeconds = definition.lifetimeSeconds;
  }
}
