import { nearestTo, vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2, SeededRandom } from '@graveshift/shared/core';

const SEEK_RADIUS = 9;
const RECONSIDER_DECISIONS = 30;
const SAME_COIN_DISTANCE = 0.6;

function identity(point: ReadonlyVec2): ReadonlyVec2 {
  return point;
}

export class CoinSeeker {
  private readonly random: SeededRandom;
  private readonly greed: number;
  private readonly target = vec2();
  private hasTarget = false;
  private cooldown = 0;

  constructor(random: SeededRandom, greed: number) {
    this.random = random;
    this.greed = greed;
  }

  choose(self: ReadonlyVec2, coins: readonly ReadonlyVec2[]): ReadonlyVec2 | null {
    if (this.hasTarget && this.follow(coins)) {
      return this.target;
    }
    this.hasTarget = false;
    if (this.cooldown > 0) {
      this.cooldown -= 1;
      return null;
    }
    this.cooldown = RECONSIDER_DECISIONS;
    const coin = nearestTo(self, coins, identity, { maxDistance: SEEK_RADIUS });
    if (coin === null || !this.random.chance(this.greed)) {
      return null;
    }
    this.lockOn(coin);
    return this.target;
  }

  private follow(coins: readonly ReadonlyVec2[]): boolean {
    const same = nearestTo(this.target, coins, identity, { maxDistance: SAME_COIN_DISTANCE });
    if (same === null) {
      return false;
    }
    this.lockOn(same);
    return true;
  }

  private lockOn(coin: ReadonlyVec2): void {
    this.hasTarget = true;
    this.target.x = coin.x;
    this.target.y = coin.y;
  }
}
