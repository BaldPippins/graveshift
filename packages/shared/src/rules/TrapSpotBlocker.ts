import type { TileMap } from '../world/TileMap.ts';
import { isSolidTrapSpot } from './trapRules.ts';
import type { TrapSpot } from './TrapSpot.ts';

export class TrapSpotBlocker {
  private readonly map: TileMap;
  private readonly solidSpots: readonly TrapSpot[];

  constructor(map: TileMap, spots: readonly TrapSpot[]) {
    this.map = map;
    this.solidSpots = spots.filter(isSolidTrapSpot);
    this.syncArmed(new Set());
  }

  setArmed(spot: TrapSpot, armed: boolean): void {
    if (isSolidTrapSpot(spot)) {
      this.map.setIndexCleared(spot.index, !armed);
    }
  }

  syncArmed(armedIndices: ReadonlySet<number>): void {
    for (const spot of this.solidSpots) {
      this.map.setIndexCleared(spot.index, !armedIndices.has(spot.index));
    }
  }
}
