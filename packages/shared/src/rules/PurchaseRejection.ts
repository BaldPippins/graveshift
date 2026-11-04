import type { ValueOf } from '../core/ValueOf.ts';

export const PurchaseRejection = {
  MerchantTooFar: 0,
  NotEnoughCoins: 1,
  AlreadyOwned: 2,
  WeaponLocked: 3,
  MaxLevel: 4,
  FullHealth: 5,
  NotAlive: 6,
  MerchantGone: 7,
  MerchantAlive: 8,
} as const;
export type PurchaseRejection = ValueOf<typeof PurchaseRejection>;
