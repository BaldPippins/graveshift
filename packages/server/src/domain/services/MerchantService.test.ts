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
import { MerchantStall } from '@graveshift/shared/rules';
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
  const merchants = new MerchantService(merchant, new MerchantStall(world.map), events);
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
    expect(emitted).toContainEqual({ type: GameEventType.MerchantReturned });
  });

  it('frees its stall for walking while away and blocks it again on return', () => {
    const { world, merchant, merchants } = setup();
    const stall = cellAt(merchant.position);
    const isBlocked = (): boolean =>
      world.map.isBlocked(stall.cx, stall.cy, CollisionLayer.Movement);
    expect(isBlocked()).toBe(true);
    merchants.damage(MERCHANT_RULES.maxHealth + 1, null);
    expect(isBlocked()).toBe(false);
    for (let wave = 1; wave <= MERCHANT_RULES.absenceWaves; wave += 1) {
      world.events.emit({ type: GameEventType.WaveStarted, wave });
    }
    expect(isBlocked()).toBe(true);
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
