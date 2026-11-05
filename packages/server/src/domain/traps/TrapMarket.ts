import type { TrapSpot } from '@graveshift/shared/rules';

export interface TrapMarket {
  readonly vacantSpots: readonly TrapSpot[];
  priceOf(spot: TrapSpot): number;
}
