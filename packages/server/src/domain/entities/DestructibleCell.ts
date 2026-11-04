import { cellCenter } from '@graveshift/shared/world';
import type { CellCoord } from '@graveshift/shared/world';
import type { ReadonlyVec2 } from '@graveshift/shared/core';

export class DestructibleCell {
  readonly index: number;
  readonly cell: CellCoord;
  readonly center: ReadonlyVec2;
  readonly maxHealth: number;
  health: number;
  wavesUntilRestore = 0;

  constructor(index: number, cell: CellCoord, maxHealth: number) {
    this.index = index;
    this.cell = cell;
    this.center = cellCenter(cell);
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  get isWrecked(): boolean {
    return this.health <= 0;
  }

  get isDamaged(): boolean {
    return this.health < this.maxHealth;
  }
}
