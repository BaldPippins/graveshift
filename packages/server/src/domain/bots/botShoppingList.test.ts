import { describe, expect, it } from 'vitest';
import { MeleeWeaponId, RangedWeaponId, UpgradeStat } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import {
  createStartingLoadout,
  ShopOfferKind,
  withUpgradeApplied,
  withWeaponUnlocked,
} from '@graveshift/shared/rules';
import type { ShopOffer } from '@graveshift/shared/rules';
import { bestOwnedMelee, bestOwnedRanged, botShoppingList } from './botShoppingList.ts';

const HEALTHY = 1;

function owning(...weapons: WeaponId[]): LoadoutState {
  return weapons.reduce(withWeaponUnlocked, createStartingLoadout());
}

function maxedDamageAndRate(loadout: LoadoutState, weapon: WeaponId): LoadoutState {
  let upgraded = loadout;
  for (let level = 0; level < 3; level += 1) {
    upgraded = withUpgradeApplied(upgraded, weapon, UpgradeStat.Damage);
    upgraded = withUpgradeApplied(upgraded, weapon, UpgradeStat.FireRate);
  }
  return upgraded;
}

function unlocksIn(offers: readonly ShopOffer[]): WeaponId[] {
  return offers.flatMap((offer) =>
    offer.kind === ShopOfferKind.UnlockWeapon ? [offer.weapon] : [],
  );
}

function upgradedIn(offers: readonly ShopOffer[]): WeaponId[] {
  return [
    ...new Set(
      offers.flatMap((offer) => (offer.kind === ShopOfferKind.UpgradeWeapon ? [offer.weapon] : [])),
    ),
  ];
}

describe('botShoppingList', () => {
  it('shops for guns first, then melee weapons, then upgrades for both', () => {
    const offers = botShoppingList(createStartingLoadout(), HEALTHY);
    expect(unlocksIn(offers)).toEqual([
      RangedWeaponId.Gatling,
      RangedWeaponId.Rifle,
      RangedWeaponId.Shotgun,
      RangedWeaponId.Smg,
      MeleeWeaponId.Warhammer,
      MeleeWeaponId.Axe,
      MeleeWeaponId.Sword,
      MeleeWeaponId.Spear,
    ]);
    expect(upgradedIn(offers)).toEqual([RangedWeaponId.Pistol, MeleeWeaponId.Shovel]);
  });

  it('skips weapons weaker than the best one already owned', () => {
    const offers = botShoppingList(owning(RangedWeaponId.Gatling, MeleeWeaponId.Warhammer), 1);
    expect(unlocksIn(offers)).toEqual([]);
    expect(upgradedIn(offers)).toEqual([RangedWeaponId.Gatling, MeleeWeaponId.Warhammer]);
  });

  it('keeps using a well upgraded weapon over a pricier plain one', () => {
    const loadout = maxedDamageAndRate(
      owning(RangedWeaponId.Smg, MeleeWeaponId.Sword),
      RangedWeaponId.Pistol,
    );
    const melee = maxedDamageAndRate(loadout, MeleeWeaponId.Shovel);
    expect(bestOwnedRanged(loadout)).toBe(RangedWeaponId.Pistol);
    expect(bestOwnedMelee(melee)).toBe(MeleeWeaponId.Shovel);
    expect(unlocksIn(botShoppingList(loadout, HEALTHY))).not.toContain(RangedWeaponId.Shotgun);
  });

  it('heals first when badly hurt', () => {
    expect(botShoppingList(createStartingLoadout(), 0.3)[0]).toEqual({ kind: ShopOfferKind.Heal });
  });
});
