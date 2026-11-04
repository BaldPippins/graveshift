import { NO_UPGRADES } from '../config/upgrades.ts';
import type { UpgradeLevels, UpgradeStat } from '../config/upgrades.ts';
import { STARTING_WEAPONS, WEAPON_IDS } from '../config/weapons.ts';
import type { WeaponId } from '../config/weapons.ts';
import type { LoadoutState } from '../model/LoadoutState.ts';

export function createStartingLoadout(): LoadoutState {
  const upgrades = Object.fromEntries(WEAPON_IDS.map((weapon) => [weapon, NO_UPGRADES])) as Record<
    WeaponId,
    UpgradeLevels
  >;
  return { ownedWeapons: [...STARTING_WEAPONS], upgrades };
}

export function ownsWeapon(loadout: LoadoutState, weapon: WeaponId): boolean {
  return loadout.ownedWeapons.includes(weapon);
}

export function upgradeLevelOf(loadout: LoadoutState, weapon: WeaponId, stat: UpgradeStat): number {
  return loadout.upgrades[weapon][stat];
}

export function withWeaponUnlocked(loadout: LoadoutState, weapon: WeaponId): LoadoutState {
  if (ownsWeapon(loadout, weapon)) {
    return loadout;
  }
  const ownedWeapons = WEAPON_IDS.filter((id) => id === weapon || ownsWeapon(loadout, id));
  return { ...loadout, ownedWeapons };
}

export function withUpgradeApplied(
  loadout: LoadoutState,
  weapon: WeaponId,
  stat: UpgradeStat,
): LoadoutState {
  const levels = loadout.upgrades[weapon];
  return {
    ...loadout,
    upgrades: { ...loadout.upgrades, [weapon]: { ...levels, [stat]: levels[stat] + 1 } },
  };
}
