import { RANGED_WEAPON_IDS, RANGED_WEAPONS, UPGRADE_STATS } from '@graveshift/shared/config';
import type { RangedWeaponId } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import { ownsWeapon, ShopOfferKind } from '@graveshift/shared/rules';
import type { ShopOffer } from '@graveshift/shared/rules';

const HEAL_BELOW_FRACTION = 0.6;

const WEAPONS_BY_VALUE: readonly RangedWeaponId[] = [...RANGED_WEAPON_IDS].sort(
  (left, right) => RANGED_WEAPONS[right].unlockPrice - RANGED_WEAPONS[left].unlockPrice,
);

export function bestOwnedWeapon(loadout: LoadoutState): RangedWeaponId | undefined {
  return WEAPONS_BY_VALUE.find((weapon) => ownsWeapon(loadout, weapon));
}

export function botShoppingList(loadout: LoadoutState, healthFraction: number): ShopOffer[] {
  const offers: ShopOffer[] = [];
  if (healthFraction < HEAL_BELOW_FRACTION) {
    offers.push({ kind: ShopOfferKind.Heal });
  }
  for (const weapon of WEAPONS_BY_VALUE) {
    if (!ownsWeapon(loadout, weapon)) {
      offers.push({ kind: ShopOfferKind.UnlockWeapon, weapon });
    }
  }
  const main = bestOwnedWeapon(loadout);
  if (main !== undefined) {
    for (const stat of UPGRADE_STATS) {
      offers.push({ kind: ShopOfferKind.UpgradeWeapon, weapon: main, stat });
    }
  }
  return offers;
}
