import { PICKUP_RULES, PickupKind, SIMULATION } from '@graveshift/shared/config';
import { cellCenter, TileKind } from '@graveshift/shared/world';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { PickupSpawner } from '../services/PickupSpawner.ts';
import { PumpkinPatch } from './PumpkinPatch.ts';

export class PumpkinPatchSystem {
  private readonly world: MatchWorld;
  private readonly spawner: PickupSpawner;
  private readonly patches: readonly PumpkinPatch[];

  constructor(world: MatchWorld, spawner: PickupSpawner) {
    this.world = world;
    this.spawner = spawner;
    this.patches = world.map
      .cellsOfKind(TileKind.PumpkinPatch)
      .map((cell) => new PumpkinPatch(cellCenter(cell)));
  }

  update(): void {
    for (const patch of this.patches) {
      if (patch.pumpkin !== null && this.world.pickups.get(patch.pumpkin.id) === patch.pumpkin) {
        continue;
      }
      if (patch.pumpkin !== null) {
        patch.pumpkin = null;
        patch.regrowRemainingSeconds = PICKUP_RULES.pumpkinRegrowSeconds;
      }
      patch.regrowRemainingSeconds -= SIMULATION.tickSeconds;
      if (patch.regrowRemainingSeconds <= 0) {
        patch.pumpkin = this.spawner.spawn(PickupKind.Pumpkin, patch.position);
      }
    }
  }
}
