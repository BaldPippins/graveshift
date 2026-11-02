import { IdPool } from '@graveshift/shared/core';
import type { SeededRandom } from '@graveshift/shared/core';
import { merchantSpot } from '@graveshift/shared/rules';
import type { TileMap } from '@graveshift/shared/world';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PickupEntity } from '../entities/PickupEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchEventBus } from './MatchEventBus.ts';

const MAX_ENTITY_ID = 0xffff;

export class MatchWorld {
  readonly map: TileMap;
  readonly random: SeededRandom;
  readonly events: MatchEventBus;
  readonly players = new Map<number, PlayerEntity>();
  readonly enemies = new Map<number, EnemyEntity>();
  readonly pickups = new Map<number, PickupEntity>();
  readonly enemyIds = new IdPool(1, MAX_ENTITY_ID);
  readonly pickupIds = new IdPool(1, MAX_ENTITY_ID);
  readonly merchant: MerchantEntity | null;
  tick = 0;

  constructor(map: TileMap, random: SeededRandom, events: MatchEventBus) {
    this.map = map;
    this.random = random;
    this.events = events;
    const spot = merchantSpot(map);
    this.merchant = spot === null ? null : new MerchantEntity(spot);
  }

  alivePlayers(): PlayerEntity[] {
    return [...this.players.values()].filter((player) => player.isAlive);
  }

  removeEnemy(enemy: EnemyEntity): void {
    if (this.enemies.delete(enemy.id)) {
      this.enemyIds.release(enemy.id);
    }
  }

  removePickup(pickup: PickupEntity): void {
    if (this.pickups.delete(pickup.id)) {
      this.pickupIds.release(pickup.id);
    }
  }
}
