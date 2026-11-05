import { describe, expect, it } from 'vitest';
import { ENEMIES, EnemyKind, HEROES, HeroId, OBSTACLE_RULES } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { CollisionLayer, MapId, parseTileMap } from '@graveshift/shared/world';
import { EnemyEntity } from '../entities/EnemyEntity.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { WreckageService } from './WreckageService.ts';

const YARD = ['#######', '#S...P#', '#..g..#', '#..T.K#', '#######'];
const GRAVE = { cx: 3, cy: 2 };
const PINE = { cx: 3, cy: 3 };

function yard(): MatchWorld {
  return new MatchWorld(
    parseTileMap({ id: MapId.Graveyard, rows: YARD }),
    new SeededRandom(9),
    new MatchEventBus(),
  );
}

function startWaves(world: MatchWorld, count: number): void {
  for (let wave = 1; wave <= count; wave += 1) {
    world.events.emit({ type: GameEventType.WaveStarted, wave });
  }
}

describe('WreckageService', () => {
  it('wrecks graves and pines once their durability runs out', () => {
    const world = yard();
    const wreckage = new WreckageService(world);
    const graveIndex = world.map.indexOf(GRAVE.cx, GRAVE.cy);
    const grave = wreckage.intactAt(graveIndex)!;
    wreckage.damage(grave, grave.maxHealth - 1, 1);
    expect(world.map.isBlocked(GRAVE.cx, GRAVE.cy, CollisionLayer.Movement)).toBe(true);
    wreckage.damage(grave, 1, 1);
    expect(wreckage.intactAt(graveIndex)).toBeNull();
    expect(world.map.isBlocked(GRAVE.cx, GRAVE.cy, CollisionLayer.Movement)).toBe(false);
    expect(world.map.isBlocked(GRAVE.cx, GRAVE.cy, CollisionLayer.Projectiles)).toBe(false);
    expect(wreckage.intactAt(world.map.indexOf(PINE.cx, PINE.cy))).not.toBeNull();
    wreckage.dispose();
  });

  it('rebuilds a wreck after two or three waves', () => {
    const world = yard();
    const wreckage = new WreckageService(world);
    const graveIndex = world.map.indexOf(GRAVE.cx, GRAVE.cy);
    wreckage.blast({ x: 3.5, y: 2.5 }, 0.4, 10_000, null);
    startWaves(world, OBSTACLE_RULES.minRestoreWaves - 1);
    wreckage.update();
    expect(wreckage.intactAt(graveIndex)).toBeNull();
    startWaves(world, OBSTACLE_RULES.maxRestoreWaves);
    wreckage.update();
    expect(wreckage.intactAt(graveIndex)).not.toBeNull();
    expect(world.map.isBlocked(GRAVE.cx, GRAVE.cy, CollisionLayer.Movement)).toBe(true);
    wreckage.dispose();
  });

  it('waits until nobody stands on the spot before rebuilding', () => {
    const world = yard();
    const wreckage = new WreckageService(world);
    const graveIndex = world.map.indexOf(GRAVE.cx, GRAVE.cy);
    wreckage.blast({ x: 3.5, y: 2.5 }, 0.4, 10_000, null);
    const zombie = new EnemyEntity(1, ENEMIES[EnemyKind.Zombie], { x: 3.5, y: 2.5 }, 50);
    world.enemies.set(zombie.id, zombie);
    const player = new PlayerEntity(2, 'P', HEROES[HeroId.Pippin], false, { x: 3.2, y: 2.9 });
    world.players.set(player.id, player);
    startWaves(world, OBSTACLE_RULES.maxRestoreWaves);
    wreckage.update();
    expect(wreckage.intactAt(graveIndex)).toBeNull();
    world.enemies.clear();
    player.position.x = 5.5;
    player.position.y = 1.5;
    wreckage.update();
    expect(wreckage.intactAt(graveIndex)).not.toBeNull();
    wreckage.dispose();
  });

  it('waits for the merchant to step off the spot before rebuilding', () => {
    const world = yard();
    const wreckage = new WreckageService(world);
    const graveIndex = world.map.indexOf(GRAVE.cx, GRAVE.cy);
    wreckage.blast({ x: 3.5, y: 2.5 }, 0.4, 10_000, null);
    const merchant = world.merchant!;
    merchant.position.x = 3.5;
    merchant.position.y = 2.5;
    startWaves(world, OBSTACLE_RULES.maxRestoreWaves);
    wreckage.update();
    expect(wreckage.intactAt(graveIndex)).toBeNull();
    merchant.position.x = 5.5;
    merchant.position.y = 3.5;
    wreckage.update();
    expect(wreckage.intactAt(graveIndex)).not.toBeNull();
    wreckage.dispose();
  });
});
