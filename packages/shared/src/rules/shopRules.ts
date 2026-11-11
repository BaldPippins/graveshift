import { assertNever } from '../core/assertNever.ts';
import { MERCHANT_RULES } from '../config/merchant.ts';
import { SHOP_RULES } from '../config/shop.ts';
import { isUpgradeMaxed, upgradePrice } from './upgradeRules.ts';
import { WEAPONS } from '../config/weapons.ts';
import type { WeaponId } from '../config/weapons.ts';
import { LifeState } from '../model/LifeState.ts';
import type { LoadoutState } from '../model/LoadoutState.ts';
import { ownsWeapon, upgradeLevelOf } from './loadoutRules.ts';
import { isMerchantDead } from './merchantRules.ts';
import { MerchantAccess } from './MerchantAccess.ts';
import { PurchaseRejection } from './PurchaseRejection.ts';
import { ShopOfferKind } from './ShopOffer.ts';
import type { ShopOffer } from './ShopOffer.ts';

export interface PurchaseContext {
  readonly loadout: LoadoutState;
  readonly coins: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly lifeState: LifeState;
  readonly merchantAccess: MerchantAccess;
  readonly allowedWeapons: readonly WeaponId[];
}

export interface PurchaseQuote {
  readonly price: number;
  readonly rejection: PurchaseRejection | null;
}

function priceOf(offer: ShopOffer, loadout: LoadoutState): number {
  switch (offer.kind) {
    case ShopOfferKind.UnlockWeapon:
      return WEAPONS[offer.weapon].unlockPrice;
    case ShopOfferKind.UpgradeWeapon:
      return upgradePrice(
        WEAPONS[offer.weapon],
        offer.stat,
        upgradeLevelOf(loadout, offer.weapon, offer.stat),
      );
    case ShopOfferKind.Heal:
      return SHOP_RULES.healPrice;
    case ShopOfferKind.ReviveMerchant:
      return MERCHANT_RULES.revivePrice;
    default:
      return assertNever(offer);
  }
}

function offerSpecificRejection(
  offer: ShopOffer,
  context: PurchaseContext,
): PurchaseRejection | null {
  switch (offer.kind) {
    case ShopOfferKind.UnlockWeapon:
      if (!context.allowedWeapons.includes(offer.weapon)) {
        return PurchaseRejection.WeaponForbidden;
      }
      return ownsWeapon(context.loadout, offer.weapon) ? PurchaseRejection.AlreadyOwned : null;
    case ShopOfferKind.UpgradeWeapon:
      if (!context.allowedWeapons.includes(offer.weapon)) {
        return PurchaseRejection.WeaponForbidden;
      }
      if (!ownsWeapon(context.loadout, offer.weapon)) {
        return PurchaseRejection.WeaponLocked;
      }
      return isUpgradeMaxed(offer.stat, upgradeLevelOf(context.loadout, offer.weapon, offer.stat))
        ? PurchaseRejection.MaxLevel
        : null;
    case ShopOfferKind.Heal:
      return context.health >= context.maxHealth ? PurchaseRejection.FullHealth : null;
    case ShopOfferKind.ReviveMerchant:
      return null;
    default:
      return assertNever(offer);
  }
}

export function quotePurchase(offer: ShopOffer, context: PurchaseContext): PurchaseQuote {
  const price = priceOf(offer, context.loadout);
  const rejection = resolveRejection(offer, context, price);
  return { price, rejection };
}

function accessRejection(offer: ShopOffer, access: MerchantAccess): PurchaseRejection | null {
  if (offer.kind === ShopOfferKind.ReviveMerchant) {
    if (!isMerchantDead(access)) {
      return PurchaseRejection.MerchantAlive;
    }
    return access === MerchantAccess.Grave ? null : PurchaseRejection.MerchantTooFar;
  }
  if (isMerchantDead(access)) {
    return PurchaseRejection.MerchantGone;
  }
  return access === MerchantAccess.TooFar ? PurchaseRejection.MerchantTooFar : null;
}

function resolveRejection(
  offer: ShopOffer,
  context: PurchaseContext,
  price: number,
): PurchaseRejection | null {
  const access = accessRejection(offer, context.merchantAccess);
  if (access !== null) {
    return access;
  }
  if (context.lifeState !== LifeState.Alive) {
    return PurchaseRejection.NotAlive;
  }
  const specific = offerSpecificRejection(offer, context);
  if (specific !== null) {
    return specific;
  }
  return context.coins < price ? PurchaseRejection.NotEnoughCoins : null;
}
