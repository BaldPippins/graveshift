import { UPGRADE_STATS } from '@graveshift/shared/config';
import type { MeleeWeaponId, RangedWeaponId, WeaponId } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import { ownsWeapon, ShopOfferKind } from '@graveshift/shared/rules';
import type { ShopOffer } from '@graveshift/shared/rules';
import type { WeaponLine } from './WeaponLine.ts';
import { MELEE_LINE, RANGED_LINE } from './weaponLines.ts';

const HEAL_BELOW_FRACTION = 0.6;

function ratingOf<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
  weapon: Weapon,
): number {
  return line.rating(weapon, loadout.upgrades[weapon]);
}

function bestOwned<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
): Weapon | undefined {
  let best: Weapon | undefined;
  for (const weapon of line.weapons) {
    if (
      ownsWeapon(loadout, weapon) &&
      (best === undefined || ratingOf(line, loadout, weapon) > ratingOf(line, loadout, best))
    ) {
      best = weapon;
    }
  }
  return best;
}

function unlocksWorthBuying<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
): ShopOffer[] {
  const best = bestOwned(line, loadout);
  const floor = best === undefined ? 0 : ratingOf(line, loadout, best);
  return line.weapons
    .filter((weapon) => !ownsWeapon(loadout, weapon) && ratingOf(line, loadout, weapon) > floor)
    .sort((left, right) => ratingOf(line, loadout, right) - ratingOf(line, loadout, left))
    .map((weapon) => ({ kind: ShopOfferKind.UnlockWeapon, weapon }));
}

function upgradesOfBest<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
): ShopOffer[] {
  const best = bestOwned(line, loadout);
  if (best === undefined) {
    return [];
  }
  return UPGRADE_STATS.map((stat) => ({ kind: ShopOfferKind.UpgradeWeapon, weapon: best, stat }));
}

export function bestOwnedRanged(loadout: LoadoutState): RangedWeaponId | undefined {
  return bestOwned(RANGED_LINE, loadout);
}

export function bestOwnedMelee(loadout: LoadoutState): MeleeWeaponId | undefined {
  return bestOwned(MELEE_LINE, loadout);
}

export function botShoppingList(loadout: LoadoutState, healthFraction: number): ShopOffer[] {
  const heal: ShopOffer[] =
    healthFraction < HEAL_BELOW_FRACTION ? [{ kind: ShopOfferKind.Heal }] : [];
  return [
    ...heal,
    ...unlocksWorthBuying(RANGED_LINE, loadout),
    ...unlocksWorthBuying(MELEE_LINE, loadout),
    ...upgradesOfBest(RANGED_LINE, loadout),
    ...upgradesOfBest(MELEE_LINE, loadout),
  ];
}
