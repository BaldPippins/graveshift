import { UPGRADE_STATS, WEAPON_IDS } from '@graveshift/shared/config';
import type { MeleeWeaponId, RangedWeaponId, WeaponId } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import { ownsWeapon, ShopOfferKind } from '@graveshift/shared/rules';
import type { ShopOffer } from '@graveshift/shared/rules';
import type { BotShoppingRules } from './BotShoppingRules.ts';
import type { WeaponLine } from './WeaponLine.ts';
import { meleeLineFor, RANGED_LINE } from './weaponLines.ts';

const HEAL_BELOW_FRACTION = 0.6;

export const OPEN_SHOPPING_RULES: BotShoppingRules = {
  allowedWeapons: WEAPON_IDS,
  friendlyFire: false,
};

function ratingOf<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
  weapon: Weapon,
): number {
  return line.rating(weapon, loadout.upgrades[weapon]);
}

function candidates<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  rules: BotShoppingRules,
): Weapon[] {
  return line.weapons.filter((weapon) => rules.allowedWeapons.includes(weapon));
}

function bestOwned<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
  rules: BotShoppingRules,
): Weapon | undefined {
  let best: Weapon | undefined;
  for (const weapon of candidates(line, rules)) {
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
  rules: BotShoppingRules,
): ShopOffer[] {
  const best = bestOwned(line, loadout, rules);
  const floor = best === undefined ? 0 : ratingOf(line, loadout, best);
  return candidates(line, rules)
    .filter((weapon) => !ownsWeapon(loadout, weapon) && ratingOf(line, loadout, weapon) > floor)
    .sort((left, right) => ratingOf(line, loadout, right) - ratingOf(line, loadout, left))
    .map((weapon) => ({ kind: ShopOfferKind.UnlockWeapon, weapon }));
}

function upgradesOfBest<Weapon extends WeaponId>(
  line: WeaponLine<Weapon>,
  loadout: LoadoutState,
  rules: BotShoppingRules,
): ShopOffer[] {
  const best = bestOwned(line, loadout, rules);
  if (best === undefined) {
    return [];
  }
  return UPGRADE_STATS.map((stat) => ({ kind: ShopOfferKind.UpgradeWeapon, weapon: best, stat }));
}

export function bestOwnedRanged(
  loadout: LoadoutState,
  rules: BotShoppingRules = OPEN_SHOPPING_RULES,
): RangedWeaponId | undefined {
  return bestOwned(RANGED_LINE, loadout, rules);
}

export function bestOwnedMelee(
  loadout: LoadoutState,
  rules: BotShoppingRules = OPEN_SHOPPING_RULES,
): MeleeWeaponId | undefined {
  return bestOwned(meleeLineFor(rules.friendlyFire), loadout, rules);
}

export function botShoppingList(
  loadout: LoadoutState,
  healthFraction: number,
  rules: BotShoppingRules = OPEN_SHOPPING_RULES,
): ShopOffer[] {
  const melee = meleeLineFor(rules.friendlyFire);
  const heal: ShopOffer[] =
    healthFraction < HEAL_BELOW_FRACTION ? [{ kind: ShopOfferKind.Heal }] : [];
  return [
    ...heal,
    ...unlocksWorthBuying(RANGED_LINE, loadout, rules),
    ...unlocksWorthBuying(melee, loadout, rules),
    ...upgradesOfBest(RANGED_LINE, loadout, rules),
    ...upgradesOfBest(melee, loadout, rules),
  ];
}
