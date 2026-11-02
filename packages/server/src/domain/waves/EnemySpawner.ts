import { ENEMIES, WAVE_RULES } from '@graveshift/shared/config';
import type { EnemyKind } from '@graveshift/shared/config';
import { distanceSquared, nearestTo } from '@graveshift/shared/core';
import { enemyHealthMultiplier } from '@graveshift/shared/rules';
import { cellCenter, CollisionLayer, resolveCircleAgainstMap } from '@graveshift/shared/world';
import type { CellCoord } from '@graveshift/shared/world';
import { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

const SPAWN_JITTER = 0.3;

export class EnemySpawner {
  private readonly world: MatchWorld;

  constructor(world: MatchWorld) {
    this.world = world;
  }

  spawn(kind: EnemyKind, wave: number): EnemyEntity {
    const definition = ENEMIES[kind];
    const cell = this.chooseSpawnCell();
    const position = cellCenter(cell);
    position.x += this.world.random.range(-SPAWN_JITTER, SPAWN_JITTER);
    position.y += this.world.random.range(-SPAWN_JITTER, SPAWN_JITTER);
    resolveCircleAgainstMap(position, definition.radius, this.world.map, CollisionLayer.Movement);
    const maxHealth = Math.round(
      definition.maxHealth * enemyHealthMultiplier(wave, this.world.players.size),
    );
    const enemy = new EnemyEntity(this.world.enemyIds.acquire(), definition, position, maxHealth);
    this.world.enemies.set(enemy.id, enemy);
    return enemy;
  }

  private chooseSpawnCell(): CellCoord {
    const spawns = this.world.map.enemySpawns;
    const minDistanceSquared = WAVE_RULES.minSpawnDistanceFromPlayers ** 2;
    const safe = spawns.filter(
      (cell) => this.distanceToNearestPlayerSquared(cell) >= minDistanceSquared,
    );
    if (safe.length > 0) {
      return this.world.random.pick(safe);
    }
    return spawns.reduce((farthest, cell) =>
      this.distanceToNearestPlayerSquared(cell) > this.distanceToNearestPlayerSquared(farthest)
        ? cell
        : farthest,
    );
  }

  private distanceToNearestPlayerSquared(cell: CellCoord): number {
    const center = cellCenter(cell);
    const nearest = nearestTo(center, this.world.players.values(), (player) => player.position);
    return nearest === null ? Number.POSITIVE_INFINITY : distanceSquared(center, nearest.position);
  }
}
