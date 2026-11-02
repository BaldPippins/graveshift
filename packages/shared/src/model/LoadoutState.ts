import type { UpgradeLevels } from '../config/upgrades.ts';
import type { WeaponId } from '../config/weapons.ts';

export interface LoadoutState {
  readonly ownedWeapons: readonly WeaponId[];
  readonly upgrades: Readonly<Record<WeaponId, UpgradeLevels>>;
}
