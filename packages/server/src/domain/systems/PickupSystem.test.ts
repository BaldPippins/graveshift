import { describe, expect, it } from 'vitest';
import { HeroId, HEROES, PICKUP_RULES, PICKUPS, PickupKind } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { MAP_DEFINITIONS, MapId, parseTileMap } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { PickupSystem } from './PickupSystem.ts';

const MAGNET_TICKS = 30;

describe('PickupSystem', () => {
  it('pulls nearby coins into the closest living player', () => {
    const events = new MatchEventBus();
    const world = new MatchWorld(
      parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
      new SeededRandom(5),
      events,
    );
    const system = new PickupSystem(world, new EconomyService(events), new PlayerLifecycle(events));
    const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Watchman], false, {
      x: 15.5,
      y: 12.5,
    });
    world.players.set(player.id, player);
    const near = new PickupSpawner(world).spawn(PickupKind.Coins, { x: 15.5, y: 10.5 });
    const far = new PickupSpawner(world).spawn(PickupKind.Coins, {
      x: 15.5,
      y: 12.5 - PICKUP_RULES.coinMagnetRadius - 1,
    });
    for (let tick = 0; tick < MAGNET_TICKS; tick += 1) {
      system.update();
    }
    expect(world.pickups.has(near.id)).toBe(false);
    expect(world.pickups.get(far.id)).toBe(far);
    expect(player.coins).toBeGreaterThanOrEqual(PICKUPS[PickupKind.Coins].amount);
  });
});
