import { describe, expect, it } from 'vitest';
import {
  ENEMIES,
  EnemyKind,
  HeroId,
  HEROES,
  MERCHANT_RULES,
  SIMULATION,
} from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent } from '@graveshift/shared/protocol';
import {
  cellAt,
  CollisionLayer,
  MAP_DEFINITIONS,
  MapId,
  parseTileMap,
} from '@graveshift/shared/world';
import { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { EnemyBrainSystem } from '../systems/EnemyBrainSystem.ts';
import { MerchantService } from './MerchantService.ts';
import { PlayerLifecycle } from './PlayerLifecycle.ts';

const ATTACK_TICKS = SIMULATION.tickRate * 3;

interface Setup {
  readonly world: MatchWorld;
  readonly merchant: MerchantEntity;
  readonly merchants: MerchantService;
  readonly brains: EnemyBrainSystem;
  readonly emitted: GameEvent[];
}

function setup(): Setup {
  const events = new MatchEventBus();
  const emitted: GameEvent[] = [];
  events.onAny((event) => {
    emitted.push(event);
  });
  const world = new MatchWorld(
    parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
    new SeededRandom(9),
    events,
  );
  const merchant = world.merchant;
  if (merchant === null) {
    throw new Error('Graveyard must have a merchant');
  }
  const merchants = new MerchantService(world);
  const brains = new EnemyBrainSystem(world, new PlayerLifecycle(events), merchants);
  return { world, merchant, merchants, brains, emitted };
}

function addPlayer(world: MatchWorld, x: number, y: number): PlayerEntity {
  const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Watchman], false, { x, y });
  world.players.set(player.id, player);
  return player;
}

function addZombieBeside(world: MatchWorld, merchant: MerchantEntity): EnemyEntity {
  const definition = ENEMIES[EnemyKind.Zombie];
  const zombie = new EnemyEntity(
    1,
    definition,
    { x: merchant.position.x, y: merchant.position.y - 1 },
    100,
  );
  world.enemies.set(zombie.id, zombie);
  return zombie;
}

describe('MerchantService', () => {
  it('dies, closes for three waves and comes back at full health', () => {
    const { world, merchant, merchants, emitted } = setup();
    merchants.damage(MERCHANT_RULES.maxHealth + 1, 7);
    expect(merchant.isAlive).toBe(false);
    expect(emitted).toContainEqual({ type: GameEventType.MerchantKilled, killerId: 7 });
    for (let wave = 1; wave < MERCHANT_RULES.absenceWaves; wave += 1) {
      world.events.emit({ type: GameEventType.WaveStarted, wave });
      expect(merchant.isAlive).toBe(false);
    }
    world.events.emit({ type: GameEventType.WaveStarted, wave: MERCHANT_RULES.absenceWaves });
    expect(merchant.health).toBe(MERCHANT_RULES.maxHealth);
    expect(emitted).toContainEqual({ type: GameEventType.MerchantReturned, reviverId: null });
  });

  it('runs off to another post in the middle of the map when hit', () => {
    const { world, merchant, merchants } = setup();
    const start = { x: merchant.position.x, y: merchant.position.y };
    const middle = { x: world.map.width / 2, y: world.map.height / 2 };
    merchants.damage(1, null);
    for (let tick = 0; tick < SIMULATION.tickRate * 10; tick += 1) {
      merchants.update();
    }
    const moved = Math.hypot(merchant.position.x - start.x, merchant.position.y - start.y);
    expect(moved).toBeGreaterThanOrEqual(MERCHANT_RULES.minHop);
    const fromMiddle = Math.hypot(merchant.position.x - middle.x, merchant.position.y - middle.y);
    expect(fromMiddle).toBeLessThanOrEqual(MERCHANT_RULES.postRadius);
    const cell = cellAt(merchant.position);
    expect(world.map.isBlocked(cell.cx, cell.cy, CollisionLayer.Movement)).toBe(false);
  });

  it('catches its breath before running again', () => {
    const { merchant, merchants } = setup();
    merchants.damage(1, null);
    let previous = { x: Number.NaN, y: Number.NaN };
    while (previous.x !== merchant.position.x || previous.y !== merchant.position.y) {
      previous = { x: merchant.position.x, y: merchant.position.y };
      merchants.update();
    }
    const post = { x: merchant.position.x, y: merchant.position.y };
    merchants.damage(1, null);
    merchants.update();
    expect(merchant.position).toEqual(post);
  });

  it('draws nearby monsters when no player is close', () => {
    const { world, merchant, brains } = setup();
    const player = addPlayer(world, 5.5, 21.5);
    addZombieBeside(world, merchant);
    for (let tick = 0; tick < ATTACK_TICKS; tick += 1) {
      brains.update();
    }
    expect(merchant.health).toBeLessThan(MERCHANT_RULES.maxHealth);
    expect(player.health).toBe(player.maxHealth);
  });

  it('lets monsters prefer a player standing close by', () => {
    const { world, merchant, brains } = setup();
    const zombie = addZombieBeside(world, merchant);
    const player = addPlayer(world, zombie.position.x - 1, zombie.position.y);
    for (let tick = 0; tick < ATTACK_TICKS; tick += 1) {
      brains.update();
    }
    expect(player.health).toBeLessThan(player.maxHealth);
    expect(merchant.health).toBe(MERCHANT_RULES.maxHealth);
  });
});
