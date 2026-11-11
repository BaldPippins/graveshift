import type { UpgradeLevels, WeaponId } from '@graveshift/shared/config';

export interface WeaponLine<Weapon extends WeaponId> {
  readonly weapons: readonly Weapon[];
  rating(weapon: Weapon, levels: UpgradeLevels): number;
}
