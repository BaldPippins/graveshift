import { WEAPON_IDS, WEAPONS } from '@graveshift/shared/config';
import type { HeroModifiers, UpgradeStat, WeaponId, WeaponStats } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import {
  createStartingLoadout,
  ownsWeapon,
  resolveWeaponStats,
  withUpgradeApplied,
  withWeaponUnlocked,
} from '@graveshift/shared/rules';

export class PlayerArsenal {
  private loadoutState: LoadoutState = createStartingLoadout();
  private readonly modifiers: HeroModifiers;
  private readonly statsCache = new Map<WeaponId, WeaponStats>();
  private readonly ammo = new Map<WeaponId, number>();
  private currentWeapon: WeaponId;
  private cooldownSeconds = 0;
  private reloadRemainingSeconds = 0;

  constructor(modifiers: HeroModifiers) {
    this.modifiers = modifiers;
    const [firstWeapon] = this.loadoutState.ownedWeapons;
    if (firstWeapon === undefined) {
      throw new Error('Starting loadout must contain a weapon');
    }
    this.currentWeapon = firstWeapon;
    this.refillAll();
  }

  get loadout(): LoadoutState {
    return this.loadoutState;
  }

  get current(): WeaponId {
    return this.currentWeapon;
  }

  get currentStats(): WeaponStats {
    return this.statsOf(this.currentWeapon);
  }

  get currentAmmo(): number {
    return this.ammo.get(this.currentWeapon) ?? 0;
  }

  get isReloading(): boolean {
    return this.reloadRemainingSeconds > 0;
  }

  get isReadyToFire(): boolean {
    return this.cooldownSeconds <= 0 && !this.isReloading;
  }

  statsOf(weapon: WeaponId): WeaponStats {
    const cached = this.statsCache.get(weapon);
    if (cached !== undefined) {
      return cached;
    }
    const stats = resolveWeaponStats(
      WEAPONS[weapon],
      this.loadoutState.upgrades[weapon],
      this.modifiers,
    );
    this.statsCache.set(weapon, stats);
    return stats;
  }

  advance(deltaSeconds: number, triggerHeld: boolean): void {
    if (this.reloadRemainingSeconds > 0) {
      this.reloadRemainingSeconds -= deltaSeconds;
      if (this.reloadRemainingSeconds <= 0) {
        this.reloadRemainingSeconds = 0;
        this.ammo.set(this.currentWeapon, this.currentStats.magazineSize);
      }
    }
    this.cooldownSeconds -= deltaSeconds;
    if (!triggerHeld) {
      this.cooldownSeconds = Math.max(0, this.cooldownSeconds);
    }
  }

  consumeShot(): boolean {
    if (!this.isReadyToFire) {
      return false;
    }
    const remaining = this.currentAmmo;
    if (remaining <= 0) {
      this.startReload();
      return false;
    }
    this.ammo.set(this.currentWeapon, remaining - 1);
    this.cooldownSeconds += this.currentStats.fireIntervalSeconds;
    if (remaining - 1 === 0) {
      this.startReload();
    }
    return true;
  }

  startReload(): void {
    if (this.isReloading || this.currentAmmo >= this.currentStats.magazineSize) {
      return;
    }
    this.reloadRemainingSeconds = this.currentStats.reloadSeconds;
  }

  switchTo(weapon: WeaponId): boolean {
    if (weapon === this.currentWeapon || !ownsWeapon(this.loadoutState, weapon)) {
      return false;
    }
    this.currentWeapon = weapon;
    this.reloadRemainingSeconds = 0;
    this.cooldownSeconds = Math.max(this.cooldownSeconds, 0.2);
    if (this.currentAmmo === 0) {
      this.startReload();
    }
    return true;
  }

  unlock(weapon: WeaponId): void {
    this.loadoutState = withWeaponUnlocked(this.loadoutState, weapon);
    this.ammo.set(weapon, this.statsOf(weapon).magazineSize);
    this.switchTo(weapon);
  }

  upgrade(weapon: WeaponId, stat: UpgradeStat): number {
    this.loadoutState = withUpgradeApplied(this.loadoutState, weapon, stat);
    this.statsCache.delete(weapon);
    this.ammo.set(weapon, this.statsOf(weapon).magazineSize);
    return this.loadoutState.upgrades[weapon][stat];
  }

  refillAll(): void {
    this.reloadRemainingSeconds = 0;
    for (const weapon of WEAPON_IDS) {
      if (ownsWeapon(this.loadoutState, weapon)) {
        this.ammo.set(weapon, this.statsOf(weapon).magazineSize);
      }
    }
  }
}
