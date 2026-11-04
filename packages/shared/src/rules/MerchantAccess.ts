import type { ValueOf } from '../core/ValueOf.ts';

export const MerchantAccess = {
  Serving: 0,
  TooFar: 1,
  Gone: 2,
  Grave: 3,
} as const;
export type MerchantAccess = ValueOf<typeof MerchantAccess>;
