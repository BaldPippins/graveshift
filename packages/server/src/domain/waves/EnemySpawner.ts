import { ENEMIES, WAVE_RULES } from '@graveshift/shared/config';
import type { EnemyKind, WaveRules } from '@graveshift/shared/config';
import { distanceSquared, nearestTo } from '@graveshift/shared/core';
import { cellCenter, CollisionLayer, resolveCircleAgainstMap } from '@graveshift/shared/world';
import type { CellCoord } from '@graveshift/shared/world';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { EnemyFactory } from '../entities/EnemyFactory.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

const SPAWN_JITTER = 0.3;

export class EnemySpawner {
  private readonly world: MatchWorld;
  private readonly factory: EnemyFactory;
  private readonly rules: WaveRules;

  constructor(world: MatchWorld, factory: EnemyFactory, rules: WaveRules = WAVE_RULES) {
    this.world = world;
    this.factory = factory;
    this.rules = rules;
  }

  spawn(kind: EnemyKind, wave: number): EnemyEntity {
    const definition = ENEMIES[kind];
    const cell = this.chooseSpawnCell();
    const position = cellCenter(cell);
    position.x += this.world.random.range(-SPAWN_JITTER, SPAWN_JITTER);
    position.y += this.world.random.range(-SPAWN_JITTER, SPAWN_JITTER);
    resolveCircleAgainstMap(position, definition.radius, this.world.map, CollisionLayer.Movement);
    return this.factory.create(kind, position, wave);
  }

  private chooseSpawnCell(): CellCoord {
    const spawns = this.world.map.enemySpawns;
    const minDistanceSquared = this.rules.minSpawnDistanceFromPlayers ** 2;
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
