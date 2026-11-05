import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, MELEE_WEAPONS, SIMULATION, WeaponId } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { HitscanResolver } from '../combat/HitscanResolver.ts';
import { MeleeResolver } from '../combat/MeleeResolver.ts';
import { PositionHistory } from '../combat/PositionHistory.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { createCombat } from '../testing/createCombat.ts';
import type { CombatRig } from '../testing/createCombat.ts';
import { MeleeSystem } from './MeleeSystem.ts';
import { WeaponSystem } from './WeaponSystem.ts';

const YARD = ['##########', '#S.......#', '#..P.T.g.#', '#........#', '##########'];
const PINE = { cx: 5, cy: 2 };
const GRAVE = { cx: 7, cy: 2 };

interface Yard {
  readonly world: MatchWorld;
  readonly combat: CombatRig;
  readonly player: PlayerEntity;
}

function yard(x: number, y: number): Yard {
  const world = new MatchWorld(
    parseTileMap({ id: MapId.Graveyard, rows: YARD }),
    new SeededRandom(2),
    new MatchEventBus(),
  );
  const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Pippin], false, { x, y });
  world.players.set(player.id, player);
  return { world, combat: createCombat(world, true), player };
}

function healthOf(setup: Yard, cell: typeof PINE): number {
  const obstacle = setup.combat.wreckage.intactAt(setup.world.map.indexOf(cell.cx, cell.cy));
  return obstacle === null ? 0 : obstacle.health;
}

describe('scenery hits', () => {
  it('lets bullets chip a pine and stops them there', () => {
    const setup = yard(3.5, 2.5);
    const weapons = new WeaponSystem(
      setup.world,
      new HitscanResolver(new PositionHistory(SIMULATION.maxRewindTicks + 2)),
      setup.combat.targets,
      setup.combat.hits,
      true,
    );
    const pineHealth = healthOf(setup, PINE);
    const graveHealth = healthOf(setup, GRAVE);
    setup.player.triggerHeld = true;
    weapons.update();
    expect(healthOf(setup, PINE)).toBeLessThan(pineHealth);
    expect(healthOf(setup, GRAVE)).toBe(graveHealth);
  });

  it('lets a melee swing chop a pine next to the player', () => {
    const setup = yard(4.4, 2.5);
    const melee = new MeleeSystem(
      setup.world,
      new MeleeResolver(new PositionHistory(4), setup.world.map),
      setup.combat.targets,
      setup.combat.hits,
      true,
    );
    const pineHealth = healthOf(setup, PINE);
    setup.player.swingHeld = true;
    melee.update();
    expect(healthOf(setup, PINE)).toBe(pineHealth - MELEE_WEAPONS[WeaponId.Shovel].stats.damage);
  });
});
