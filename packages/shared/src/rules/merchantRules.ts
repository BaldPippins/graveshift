import { MERCHANT_RULES } from '../config/merchant.ts';
import type { MerchantSnapshot } from '../protocol/EntitySnapshots.ts';
import type { ReadonlyVec2 } from '../core/Vec2.ts';
import { distanceSquared } from '../core/vectorMath.ts';
import { cellCenter } from '../world/cellMath.ts';
import { TileKind } from '../world/TileKind.ts';
import type { TileMap } from '../world/TileMap.ts';
import { MerchantAccess } from './MerchantAccess.ts';

export function merchantSpot(map: TileMap): ReadonlyVec2 | null {
  const [cell] = map.cellsOfKind(TileKind.Merchant);
  return cell === undefined ? null : cellCenter(cell);
}

export function merchantAccessFor(
  position: ReadonlyVec2,
  merchant: ReadonlyVec2 | null,
  merchantAlive: boolean,
): MerchantAccess {
  if (merchant === null) {
    return MerchantAccess.Gone;
  }
  const near = distanceSquared(position, merchant) <= MERCHANT_RULES.reach ** 2;
  if (!merchantAlive) {
    return near ? MerchantAccess.Grave : MerchantAccess.Gone;
  }
  return near ? MerchantAccess.Serving : MerchantAccess.TooFar;
}

export function isMerchantDead(access: MerchantAccess): boolean {
  return access === MerchantAccess.Gone || access === MerchantAccess.Grave;
}

export function isMerchantPresent(merchant: MerchantSnapshot | null): boolean {
  return merchant !== null && merchant.wavesUntilReturn === 0;
}
