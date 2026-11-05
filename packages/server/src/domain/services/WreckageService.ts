import { OBSTACLE_RULES } from '@graveshift/shared/config';
import type { ReadonlyVec2, Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { Wreckage } from '@graveshift/shared/rules';
import { circleOverlapsCell, TILE_TRAITS } from '@graveshift/shared/world';
import type { CellCoord } from '@graveshift/shared/world';
import { DestructibleCell } from '../entities/DestructibleCell.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

const PICKUP_CLEARANCE = 0.3;

export class WreckageService {
  private readonly world: MatchWorld;
  private readonly wreckage: Wreckage;
  private readonly cells = new Map<number, DestructibleCell>();
  private readonly unsubscribe: Unsubscribe;

  constructor(world: MatchWorld) {
    this.world = world;
    this.wreckage = new Wreckage(world.map);
    const map = world.map;
    for (let index = 0; index < map.cellCount; index += 1) {
      const cell = map.cellOfIndex(index);
      const durability = TILE_TRAITS[map.kindAt(cell.cx, cell.cy)].durability;
      if (durability !== null) {
        this.cells.set(index, new DestructibleCell(index, cell, durability));
      }
    }
    this.unsubscribe = world.events.on(GameEventType.WaveStarted, () => {
      this.countDownRestoration();
    });
  }

  get damaged(): DestructibleCell[] {
    return [...this.cells.values()].filter((obstacle) => obstacle.isDamaged);
  }

  get intact(): DestructibleCell[] {
    return [...this.cells.values()].filter((obstacle) => !obstacle.isWrecked);
  }

  intactAt(index: number): DestructibleCell | null {
    const obstacle = this.cells.get(index);
    return obstacle === undefined || obstacle.isWrecked ? null : obstacle;
  }

  damage(obstacle: DestructibleCell, amount: number, attackerId: number | null): void {
    if (obstacle.isWrecked) {
      return;
    }
    const remaining = Math.max(0, obstacle.health - amount);
    obstacle.health = remaining;
    if (remaining > 0) {
      return;
    }
    obstacle.wavesUntilRestore = this.world.random.integer(
      OBSTACLE_RULES.minRestoreWaves,
      OBSTACLE_RULES.maxRestoreWaves + 1,
    );
    this.wreckage.setWrecked(obstacle.index, true);
    this.world.events.emit({
      type: GameEventType.ObstacleWrecked,
      cell: obstacle.index,
      attackerId,
    });
  }

  blast(center: ReadonlyVec2, radius: number, amount: number, attackerId: number | null): void {
    for (const obstacle of this.intact) {
      if (circleOverlapsCell(center, radius, obstacle.cell.cx, obstacle.cell.cy)) {
        this.damage(obstacle, amount, attackerId);
      }
    }
  }

  update(): void {
    for (const obstacle of this.cells.values()) {
      if (obstacle.isWrecked && obstacle.wavesUntilRestore <= 0 && this.isVacant(obstacle.cell)) {
        this.restore(obstacle);
      }
    }
  }

  dispose(): void {
    this.unsubscribe();
  }

  private countDownRestoration(): void {
    for (const obstacle of this.cells.values()) {
      if (obstacle.isWrecked) {
        obstacle.wavesUntilRestore -= 1;
      }
    }
  }

  private restore(obstacle: DestructibleCell): void {
    obstacle.health = obstacle.maxHealth;
    obstacle.wavesUntilRestore = 0;
    this.wreckage.setWrecked(obstacle.index, false);
    this.world.events.emit({ type: GameEventType.ObstacleRestored, cell: obstacle.index });
  }

  private isVacant(cell: CellCoord): boolean {
    const merchant = this.world.merchant;
    if (
      merchant !== null &&
      circleOverlapsCell(merchant.position, merchant.radius, cell.cx, cell.cy)
    ) {
      return false;
    }
    for (const player of this.world.players.values()) {
      if (circleOverlapsCell(player.position, player.radius, cell.cx, cell.cy)) {
        return false;
      }
    }
    for (const enemy of this.world.enemies.values()) {
      const solid = !enemy.definition.phasesThroughWalls;
      if (solid && circleOverlapsCell(enemy.position, enemy.radius, cell.cx, cell.cy)) {
        return false;
      }
    }
    for (const pickup of this.world.pickups.values()) {
      if (circleOverlapsCell(pickup.position, PICKUP_CLEARANCE, cell.cx, cell.cy)) {
        return false;
      }
    }
    return true;
  }
}
