import { describe, expect, it } from 'vitest';
import {
  HeroId,
  HEROES,
  PICKUP_RULES,
  PICKUPS,
  PickupKind,
  SIMULATION,
} from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { MAP_DEFINITIONS, MapId, parseTileMap, TileKind } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { PickupSystem } from '../systems/PickupSystem.ts';
import { PumpkinPatchSystem } from './PumpkinPatchSystem.ts';

function pumpkinCount(world: MatchWorld): number {
  return [...world.pickups.values()].filter(
    (pickup) => pickup.definition.kind === PickupKind.Pumpkin,
  ).length;
}

describe('PumpkinPatchSystem', () => {
  it('heals whoever eats a pumpkin and regrows it later', () => {
    const events = new MatchEventBus();
    const world = new MatchWorld(
      parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
      new SeededRandom(3),
      events,
    );
    const patches = new PumpkinPatchSystem(world, new PickupSpawner(world));
    const pickups = new PickupSystem(
      world,
      new EconomyService(events),
      new PlayerLifecycle(events),
    );
    const step = (): void => {
      pickups.update();
      patches.update();
    };
    step();
    const patchCount = world.map.cellsOfKind(TileKind.PumpkinPatch).length;
    expect(pumpkinCount(world)).toBe(patchCount);

    const [pumpkin] = world.pickups.values();
    if (pumpkin === undefined) {
      throw new Error('No pumpkin grown');
    }
    const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Watchman], false, {
      ...pumpkin.position,
    });
    player.health = 10;
    world.players.set(player.id, player);
    step();
    expect(player.health).toBe(10 + PICKUPS[PickupKind.Pumpkin].amount);
    expect(pumpkinCount(world)).toBe(patchCount - 1);

    for (
      let tick = 0;
      tick < PICKUP_RULES.pumpkinRegrowSeconds * SIMULATION.tickRate - 2;
      tick += 1
    ) {
      player.position.x = 0;
      step();
    }
    expect(pumpkinCount(world)).toBe(patchCount - 1);
    step();
    step();
    expect(pumpkinCount(world)).toBe(patchCount);
  });
});
