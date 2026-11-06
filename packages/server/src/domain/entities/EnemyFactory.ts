import { ENEMIES, WAVE_RULES } from '@graveshift/shared/config';
import type { EnemyKind, WaveRules } from '@graveshift/shared/config';
import type { Vec2 } from '@graveshift/shared/core';
import { enemyHealthMultiplier } from '@graveshift/shared/rules';
import type { MatchWorld } from '../match/MatchWorld.ts';
import { EnemyEntity } from './EnemyEntity.ts';

export class EnemyFactory {
  private readonly world: MatchWorld;
  private readonly rules: WaveRules;

  constructor(world: MatchWorld, rules: WaveRules = WAVE_RULES) {
    this.world = world;
    this.rules = rules;
  }

  create(kind: EnemyKind, position: Vec2, wave: number): EnemyEntity {
    const definition = ENEMIES[kind];
    const maxHealth = Math.round(
      definition.maxHealth * enemyHealthMultiplier(wave, this.world.players.size, this.rules),
    );
    const enemy = new EnemyEntity(this.world.enemyIds.acquire(), definition, position, maxHealth);
    this.world.enemies.set(enemy.id, enemy);
    return enemy;
  }
}
