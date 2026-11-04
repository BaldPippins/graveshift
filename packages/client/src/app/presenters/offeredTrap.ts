import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { TrapState } from '@graveshift/shared/model';
import type { TrapSnapshot } from '@graveshift/shared/protocol';
import { MerchantAccess, trapSpotNear } from '@graveshift/shared/rules';
import type { TrapSpot } from '@graveshift/shared/rules';

export function vacantTrapSpots(
  trapSpots: readonly TrapSpot[],
  traps: readonly TrapSnapshot[],
): readonly TrapSpot[] {
  const taken = new Set(
    traps.filter((trap) => trap.state !== TrapState.Spent).map((trap) => trap.cell),
  );
  return trapSpots.filter((spot) => !taken.has(spot.index));
}

export function offeredTrap(
  position: ReadonlyVec2,
  vacantSpots: readonly TrapSpot[],
  merchant: ReadonlyVec2 | null,
  merchantAccess: MerchantAccess,
): TrapSpot | null {
  const spot = trapSpotNear(position, vacantSpots);
  const merchantNear =
    merchantAccess === MerchantAccess.Serving || merchantAccess === MerchantAccess.Grave;
  if (spot === null || !merchantNear || merchant === null) {
    return spot;
  }
  return distanceSquared(position, spot.center) < distanceSquared(position, merchant) ? spot : null;
}
