import { distanceSquared } from '@graveshift/shared/core';
import type { SeededRandom } from '@graveshift/shared/core';
import type { TrapSpot } from '@graveshift/shared/rules';
import type { RearmRequest } from './RearmRequest.ts';
import type { TrapMarket } from '../traps/TrapMarket.ts';

export const BOT_REARM_CHANCE = 0.35;

export class TrapRearmPlanner {
  private readonly random: SeededRandom;
  private readonly market: TrapMarket;
  private readonly rolledWave = new Map<number, number>();
  private readonly targets = new Map<number, number>();

  constructor(random: SeededRandom, market: TrapMarket) {
    this.random = random;
    this.market = market;
  }

  targetFor(request: RearmRequest): TrapSpot | null {
    if (this.rolledWave.get(request.botId) !== request.wave) {
      this.rolledWave.set(request.botId, request.wave);
      this.targets.delete(request.botId);
      if (this.random.chance(BOT_REARM_CHANCE)) {
        this.claim(request);
      }
    }
    const cell = this.targets.get(request.botId);
    const target = this.market.vacantSpots.find((spot) => spot.index === cell);
    if (target === undefined || this.market.priceOf(target) > request.coins) {
      this.targets.delete(request.botId);
      return null;
    }
    return target;
  }

  done(botId: number): void {
    this.targets.delete(botId);
  }

  private claim(request: RearmRequest): void {
    const claimed = new Set(this.targets.values());
    let best: TrapSpot | null = null;
    for (const spot of this.market.vacantSpots) {
      if (claimed.has(spot.index) || this.market.priceOf(spot) > request.coins) {
        continue;
      }
      if (
        best === null ||
        distanceSquared(request.position, spot.center) <
          distanceSquared(request.position, best.center)
      ) {
        best = spot;
      }
    }
    if (best !== null) {
      this.targets.set(request.botId, best.index);
    }
  }
}
