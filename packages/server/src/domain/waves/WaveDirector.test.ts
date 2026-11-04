import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, SIMULATION } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { MatchPhase } from '@graveshift/shared/model';
import { MapId, tileMapOf } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { EnemySpawner } from './EnemySpawner.ts';
import { WaveDirector } from './WaveDirector.ts';
import { EnemyFactory } from '../entities/EnemyFactory.ts';

describe('WaveDirector', () => {
  it.each([10, 15, 20])('ends in victory after %i waves', (totalWaves) => {
    const events = new MatchEventBus();
    const world = new MatchWorld(tileMapOf(MapId.Graveyard), new SeededRandom(42), events);
    const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Watchman], false, {
      ...world.map.playerSpawnPoint(0),
    });
    world.players.set(player.id, player);
    const director = new WaveDirector(
      world,
      new PlayerLifecycle(events),
      new EnemySpawner(world, new EnemyFactory(world)),
      totalWaves,
    );

    for (let tick = 0; tick < SIMULATION.tickRate * 1200 && !director.isOver; tick += 1) {
      director.update();
      for (const enemy of world.enemies.values()) {
        world.removeEnemy(enemy);
      }
      director.voteSkip(player.id);
      if (director.wave < totalWaves) {
        expect(director.phase).not.toBe(MatchPhase.Victory);
      }
    }

    expect(director.isOver).toBe(true);
    expect(director.phase).toBe(MatchPhase.Victory);
    expect(director.wave).toBe(totalWaves);
  });
});
