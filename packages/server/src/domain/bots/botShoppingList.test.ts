import { describe, expect, it } from 'vitest';
import { WeaponId } from '@graveshift/shared/config';
import { createStartingLoadout, ShopOfferKind, withWeaponUnlocked } from '@graveshift/shared/rules';
import { botShoppingList } from './botShoppingList.ts';

describe('bot shopping list', () => {
  it('buys and upgrades only allowed ranged weapons', () => {
    const loadout = withWeaponUnlocked(createStartingLoadout(), WeaponId.Axe);
    const offers = botShoppingList(loadout, 1, [WeaponId.Pistol, WeaponId.Shotgun, WeaponId.Axe]);
    expect(offers).toContainEqual({ kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Shotgun });
    expect(offers.filter((offer) => 'weapon' in offer).map((offer) => offer.weapon)).toEqual(
      expect.arrayContaining([WeaponId.Pistol, WeaponId.Shotgun]),
    );
    expect(offers.some((offer) => 'weapon' in offer && offer.weapon === WeaponId.Axe)).toBe(false);
  });
});
