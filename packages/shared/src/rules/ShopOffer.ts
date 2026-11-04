import type { ValueOf } from '../core/ValueOf.ts';
import type { UpgradeStat } from '../config/upgrades.ts';
import type { WeaponId } from '../config/weapons.ts';

export const ShopOfferKind = {
  UnlockWeapon: 0,
  UpgradeWeapon: 1,
  Heal: 2,
  ReviveMerchant: 3,
} as const;
export type ShopOfferKind = ValueOf<typeof ShopOfferKind>;
export const SHOP_OFFER_KINDS: readonly ShopOfferKind[] = Object.values(ShopOfferKind);

export interface UnlockWeaponOffer {
  readonly kind: typeof ShopOfferKind.UnlockWeapon;
  readonly weapon: WeaponId;
}

export interface UpgradeWeaponOffer {
  readonly kind: typeof ShopOfferKind.UpgradeWeapon;
  readonly weapon: WeaponId;
  readonly stat: UpgradeStat;
}

export interface HealOffer {
  readonly kind: typeof ShopOfferKind.Heal;
}

export interface ReviveMerchantOffer {
  readonly kind: typeof ShopOfferKind.ReviveMerchant;
}

export type ShopOffer = UnlockWeaponOffer | UpgradeWeaponOffer | HealOffer | ReviveMerchantOffer;
