import { UPGRADE_STATS, WEAPON_IDS, WEAPONS } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import { ownsWeapon, ShopOfferKind } from '@graveshift/shared/rules';
import type { ShopOffer } from '@graveshift/shared/rules';

const HEAL_BELOW_FRACTION = 0.6;

const WEAPONS_BY_VALUE: readonly WeaponId[] = [...WEAPON_IDS].sort(
  (left, right) => WEAPONS[right].unlockPrice - WEAPONS[left].unlockPrice,
);

export function bestOwnedWeapon(loadout: LoadoutState): WeaponId | undefined {
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
