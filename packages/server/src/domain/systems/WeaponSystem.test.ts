import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, SIMULATION, WeaponId } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { MerchantStall } from '@graveshift/shared/rules';
import { MapId, tileMapOf } from '@graveshift/shared/world';
import { HitscanResolver } from '../combat/HitscanResolver.ts';
import { PositionHistory } from '../combat/PositionHistory.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { EventOutbox } from '../match/EventOutbox.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { EnemyDamageService } from '../services/EnemyDamageService.ts';
import { MerchantService } from '../services/MerchantService.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { WeaponSystem } from './WeaponSystem.ts';

describe('WeaponSystem', () => {
  it.each([WeaponId.Pistol, WeaponId.Rifle])(
    'stops weapon %s at allies without damage when friendly fire is disabled',
    (weapon) => {
      const events = new MatchEventBus();
      const world = new MatchWorld(tileMapOf(MapId.Graveyard), new SeededRandom(3), events);
      const outbox = new EventOutbox(events);
      const shooter = new PlayerEntity(
        1,
        'Tester',
        HEROES[HeroId.Watchman],
        false,
        world.map.playerSpawnPoint(0),
      );
      const ally = new PlayerEntity(
        2,
        'Ally',
        HEROES[HeroId.Pippin],
        false,
        world.map.playerSpawnPoint(1),
      );
      world.players.set(shooter.id, shooter);
      world.players.set(ally.id, ally);
      if (weapon === WeaponId.Rifle) {
        shooter.arsenal.unlock(weapon);
      }
      shooter.aim = Math.atan2(
        ally.position.y - shooter.position.y,
        ally.position.x - shooter.position.x,
      );
      shooter.triggerHeld = true;
      const lifecycle = new PlayerLifecycle(events);
      const merchants = new MerchantService(world.merchant, new MerchantStall(world.map), events);
      const enemyDamage = new EnemyDamageService(
        world,
        new EconomyService(events),
        new PickupSpawner(world),
      );
      const weapons = new WeaponSystem(
        world,
        new HitscanResolver(new PositionHistory(SIMULATION.maxRewindTicks + 2)),
        enemyDamage,
        lifecycle,
        merchants,
        false,
      );
      const initialHealth = ally.health;

      for (let tick = 0; tick < SIMULATION.tickRate * 2; tick += 1) {
        world.tick += 1;
        weapons.update();
      }
      const emitted = outbox.drain();
      const shot = emitted.find((event) => event.type === GameEventType.ShotFired);
      if (shot === undefined) {
        throw new Error('Shot missing');
      }
      expect(shot.weapon).toBe(weapon);
      expect(ally.health).toBe(initialHealth);
      expect(emitted.some((event) => event.type === GameEventType.PlayerDamaged)).toBe(false);
      expect(Math.hypot(shot.toX - ally.position.x, shot.toY - ally.position.y)).toBeLessThan(1);
      merchants.dispose();
      outbox.dispose();
    },
  );
});
