import { describe, expect, it } from 'vitest';
import {
  ENEMIES,
  EnemyKind,
  HEROES,
  HeroId,
  MELEE_RULES,
  MELEE_WEAPONS,
  SIMULATION,
  UpgradeStat,
  WeaponId,
} from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent, MeleeSwungEvent } from '@graveshift/shared/protocol';
import { MerchantStall } from '@graveshift/shared/rules';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { MeleeResolver } from '../combat/MeleeResolver.ts';
import { PositionHistory } from '../combat/PositionHistory.ts';
import { EnemyEntity } from '../entities/EnemyEntity.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { EnemyDamageService } from '../services/EnemyDamageService.ts';
import { MerchantService } from '../services/MerchantService.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { MeleeSystem } from './MeleeSystem.ts';

const ARENA = [
  '############',
  '#S.........#',
  '#..........#',
  '#....P.....#',
  '#..........#',
  '#.........S#',
  '############',
];
const TOUGH = 10_000;

interface Arena {
  readonly world: MatchWorld;
  readonly player: PlayerEntity;
  readonly melee: MeleeSystem;
  readonly emitted: GameEvent[];
}

function arena(friendlyFire = true): Arena {
  const events = new MatchEventBus();
  const emitted: GameEvent[] = [];
  events.onAny((event) => {
    emitted.push(event);
  });
  const world = new MatchWorld(
    parseTileMap({ id: MapId.Graveyard, rows: ARENA }),
    new SeededRandom(5),
    events,
  );
  const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Pippin], false, { x: 5.5, y: 3.5 });
  world.players.set(player.id, player);
  const lifecycle = new PlayerLifecycle(events);
  const melee = new MeleeSystem(
    world,
    new MeleeResolver(new PositionHistory(4), world.map),
    new EnemyDamageService(world, new EconomyService(events), new PickupSpawner(world)),
    lifecycle,
    new MerchantService(world.merchant, new MerchantStall(world.map), events),
    friendlyFire,
  );
  return { world, player, melee, emitted };
}

function addZombie(
  world: MatchWorld,
  id: number,
  x: number,
  y: number,
  health: number,
): EnemyEntity {
  const zombie = new EnemyEntity(id, ENEMIES[EnemyKind.Zombie], { x, y }, health);
  world.enemies.set(zombie.id, zombie);
  return zombie;
}

function swingOnce(setup: Arena): void {
  setup.player.swingHeld = true;
  setup.melee.update();
  setup.player.swingHeld = false;
  setup.melee.update();
}

describe('MeleeSystem', () => {
  it('hits everyone inside the swept arc and nobody behind', () => {
    const setup = arena();
    const front = addZombie(setup.world, 1, 6.5, 3.5, TOUGH);
    const flank = addZombie(setup.world, 2, 6.2, 2.8, TOUGH);
    const behind = addZombie(setup.world, 3, 4.5, 3.5, TOUGH);
    const far = addZombie(setup.world, 4, 9.5, 3.5, TOUGH);
    swingOnce(setup);
    const damage = MELEE_WEAPONS[WeaponId.Shovel].stats.damage;
    expect(front.health).toBe(TOUGH - damage);
    expect(flank.health).toBe(TOUGH - damage);
    expect(behind.health).toBe(TOUGH);
    expect(far.health).toBe(TOUGH);
    expect(setup.emitted).toContainEqual(
      expect.objectContaining({ type: GameEventType.MeleeSwung, hits: 2, furious: false }),
    );
  });

  it('swings right under a flying bat without touching it', () => {
    const setup = arena();
    const bat = new EnemyEntity(5, ENEMIES[EnemyKind.Bat], { x: 6.4, y: 3.5 }, TOUGH);
    setup.world.enemies.set(bat.id, bat);
    const zombie = addZombie(setup.world, 6, 6.5, 3.6, TOUGH);
    swingOnce(setup);
    expect(bat.health).toBe(TOUGH);
    expect(zombie.health).toBeLessThan(TOUGH);
  });

  it('waits for the swing cooldown while the button is held', () => {
    const setup = arena();
    const zombie = addZombie(setup.world, 1, 6.5, 3.5, TOUGH);
    setup.player.swingHeld = true;
    for (let tick = 0; tick < SIMULATION.tickRate; tick += 1) {
      setup.melee.update();
    }
    const swings = setup.emitted.filter((event) => event.type === GameEventType.MeleeSwung);
    const expected = Math.ceil(1 / MELEE_WEAPONS[WeaponId.Shovel].stats.swingSeconds);
    expect(swings.length).toBe(expected);
    expect(zombie.health).toBeLessThan(TOUGH);
  });

  it('unleashes fury after enough melee kills and doubles the damage', () => {
    const setup = arena();
    setup.player.meleeCharge = MELEE_RULES.killsForFury - 1;
    addZombie(setup.world, 1, 6.5, 3.5, 1);
    swingOnce(setup);
    expect(setup.emitted).toContainEqual({ type: GameEventType.FuryUnleashed, playerId: 1 });
    expect(setup.emitted).toContainEqual(
      expect.objectContaining({ type: GameEventType.EnemyKilled, weapon: WeaponId.Shovel }),
    );
    expect(setup.player.meleeCharge).toBe(0);
    expect(setup.player.isFurious).toBe(true);

    for (let tick = 0; tick < SIMULATION.tickRate; tick += 1) {
      setup.melee.update();
    }
    const brute = addZombie(setup.world, 2, 6.5, 3.5, TOUGH);
    swingOnce(setup);
    expect(brute.health).toBe(
      TOUGH - MELEE_WEAPONS[WeaponId.Shovel].stats.damage * MELEE_RULES.furyDamageMultiplier,
    );
    expect(setup.player.meleeCharge).toBe(0);

    for (let tick = 0; tick < MELEE_RULES.furySeconds * SIMULATION.tickRate; tick += 1) {
      setup.melee.update();
    }
    expect(setup.player.isFurious).toBe(false);
  });

  it('spares allies only when the host turned friendly fire off', () => {
    for (const friendlyFire of [true, false]) {
      const setup = arena(friendlyFire);
      const ally = new PlayerEntity(2, 'Ally', HEROES[HeroId.Agatha], false, { x: 6.4, y: 3.5 });
      setup.world.players.set(ally.id, ally);
      const zombie = addZombie(setup.world, 1, 6.6, 3.5, TOUGH);
      swingOnce(setup);
      expect(zombie.health).toBeLessThan(TOUGH);
      expect(ally.health < ally.maxHealth).toBe(friendlyFire);
    }
  });

  it('lands double-damage crits with the upgraded chance', () => {
    const setup = arena();
    for (let level = 0; level < 3; level += 1) {
      setup.player.arsenal.upgrade(WeaponId.Shovel, UpgradeStat.Capacity);
    }
    const zombie = addZombie(setup.world, 1, 6.5, 3.5, TOUGH * 100);
    const swings = 200;
    for (let swing = 0; swing < swings; swing += 1) {
      swingOnce(setup);
      for (let tick = 0; tick < SIMULATION.tickRate; tick += 1) {
        setup.melee.update();
      }
    }
    const strikes = setup.emitted.filter(
      (event): event is MeleeSwungEvent => event.type === GameEventType.MeleeSwung,
    );
    const crits = strikes.filter((event) => event.critical);
    const damage = setup.player.arsenal.meleeStats.damage;
    expect(strikes).toHaveLength(swings);
    expect(crits.length / swings).toBeGreaterThan(0.2);
    expect(crits.length / swings).toBeLessThan(0.4);
    expect(zombie.health).toBeCloseTo(TOUGH * 100 - damage * (swings + crits.length));
  });

  it('cannot swing through a wall', () => {
    const setup = arena();
    setup.player.position.x = 1.5;
    setup.player.position.y = 3.5;
    setup.player.aim = Math.PI;
    const outside = addZombie(setup.world, 1, 0.4, 3.5, TOUGH);
    swingOnce(setup);
    expect(outside.health).toBe(TOUGH);
  });
});
