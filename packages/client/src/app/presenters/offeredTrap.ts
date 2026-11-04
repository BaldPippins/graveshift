import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { MerchantAccess, trapSpotNear } from '@graveshift/shared/rules';
import type { TrapSpot } from '@graveshift/shared/rules';

export function offeredTrap(
  position: ReadonlyVec2,
  trapSpots: readonly TrapSpot[],
  merchant: ReadonlyVec2 | null,
  merchantAccess: MerchantAccess,
): TrapSpot | null {
  const spot = trapSpotNear(position, trapSpots);
  const merchantNear =
    merchantAccess === MerchantAccess.Serving || merchantAccess === MerchantAccess.Grave;
  if (spot === null || !merchantNear || merchant === null) {
    return spot;
  }
  return distanceSquared(position, spot.center) < distanceSquared(position, merchant) ? spot : null;
}
