import { DROPPABLE_PICKUP_KINDS, PICKUPS } from '@graveshift/shared/config';
import type { PickupKind } from '@graveshift/shared/config';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { PickupEntity } from '../entities/PickupEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

const DROP_SCATTER = 0.35;

export class PickupSpawner {
  private readonly world: MatchWorld;

  constructor(world: MatchWorld) {
    this.world = world;
  }

  rollDrops(origin: ReadonlyVec2): void {
    for (const kind of DROPPABLE_PICKUP_KINDS) {
      if (!this.world.random.chance(PICKUPS[kind].dropChance)) {
        continue;
      }
      this.spawn(kind, {
        x: origin.x + this.world.random.range(-DROP_SCATTER, DROP_SCATTER),
        y: origin.y + this.world.random.range(-DROP_SCATTER, DROP_SCATTER),
      });
    }
  }

  spawn(kind: PickupKind, position: ReadonlyVec2): PickupEntity {
    const pickup = new PickupEntity(this.world.pickupIds.acquire(), PICKUPS[kind], {
      x: position.x,
      y: position.y,
    });
    this.world.pickups.set(pickup.id, pickup);
    return pickup;
  }
}
