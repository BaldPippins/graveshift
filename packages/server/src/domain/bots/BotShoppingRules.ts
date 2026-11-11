import type { WeaponId } from '@graveshift/shared/config';

export interface BotShoppingRules {
  readonly allowedWeapons: readonly WeaponId[];
  readonly friendlyFire: boolean;
}
