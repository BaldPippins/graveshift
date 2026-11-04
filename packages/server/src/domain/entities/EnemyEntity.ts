import type { EnemyDefinition } from '@graveshift/shared/config';
import type { Vec2 } from '@graveshift/shared/core';
import { EnemyAction } from '@graveshift/shared/model';
import type { Body } from './Body.ts';

export class EnemyEntity implements Body {
  readonly id: number;
  readonly definition: EnemyDefinition;
  readonly position: Vec2;
  readonly maxHealth: number;
  health: number;
  facing = 0;
  action: EnemyAction = EnemyAction.Moving;
  attackCooldownSeconds = 0;
  snared = false;

  constructor(id: number, definition: EnemyDefinition, position: Vec2, maxHealth: number) {
    this.id = id;
    this.definition = definition;
    this.position = position;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  get radius(): number {
    return this.definition.radius;
  }

  get isDead(): boolean {
    return this.health <= 0;
  }
}
