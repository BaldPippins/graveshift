import {
  isMeleeWeapon,
  MELEE_WEAPONS,
  RANGED_WEAPON_IDS,
  RANGED_WEAPONS,
  STARTING_MELEE_WEAPON,
  STARTING_RANGED_WEAPON,
} from '@graveshift/shared/config';
import type {
  HeroModifiers,
  MeleeStats,
  MeleeWeaponId,
  RangedStats,
  RangedWeaponId,
  UpgradeStat,
  WeaponId,
} from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import {
  createStartingLoadout,
  ownsWeapon,
  resolveMeleeStats,
  resolveWeaponStats,
  withUpgradeApplied,
  withWeaponUnlocked,
} from '@graveshift/shared/rules';

const SWITCH_DELAY_SECONDS = 0.2;

export class PlayerArsenal {
  private loadoutState: LoadoutState = createStartingLoadout();
  private readonly modifiers: HeroModifiers;
  private readonly rangedStatsCache = new Map<RangedWeaponId, RangedStats>();
  private readonly meleeStatsCache = new Map<MeleeWeaponId, MeleeStats>();
  private readonly ammo = new Map<RangedWeaponId, number>();
  private currentWeapon: RangedWeaponId = STARTING_RANGED_WEAPON;
  private currentMelee: MeleeWeaponId = STARTING_MELEE_WEAPON;
  private cooldownSeconds = 0;
  private swingCooldownSeconds = 0;
  private reloadRemainingSeconds = 0;

  constructor(modifiers: HeroModifiers) {
    this.modifiers = modifiers;
    this.refillAll();
  }

  get loadout(): LoadoutState {
    return this.loadoutState;
  }

  get current(): RangedWeaponId {
    return this.currentWeapon;
  }

  get currentStats(): RangedStats {
    return this.statsOf(this.currentWeapon);
  }

  get melee(): MeleeWeaponId {
    return this.currentMelee;
  }

  get meleeStats(): MeleeStats {
    return this.meleeStatsOf(this.currentMelee);
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

  statsOf(weapon: RangedWeaponId): RangedStats {
    const cached = this.rangedStatsCache.get(weapon);
    if (cached !== undefined) {
      return cached;
    }
    const stats = resolveWeaponStats(
      RANGED_WEAPONS[weapon],
      this.loadoutState.upgrades[weapon],
      this.modifiers,
    );
    this.rangedStatsCache.set(weapon, stats);
    return stats;
  }

  meleeStatsOf(weapon: MeleeWeaponId): MeleeStats {
    const cached = this.meleeStatsCache.get(weapon);
    if (cached !== undefined) {
      return cached;
    }
    const stats = resolveMeleeStats(
      MELEE_WEAPONS[weapon],
      this.loadoutState.upgrades[weapon],
      this.modifiers,
    );
    this.meleeStatsCache.set(weapon, stats);
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

  advanceMelee(deltaSeconds: number, swingHeld: boolean): void {
    this.swingCooldownSeconds -= deltaSeconds;
    if (!swingHeld) {
      this.swingCooldownSeconds = Math.max(0, this.swingCooldownSeconds);
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

  consumeSwing(): boolean {
    if (this.swingCooldownSeconds > 0) {
      return false;
    }
    this.swingCooldownSeconds += this.meleeStats.swingSeconds;
    return true;
  }

  startReload(): void {
    if (this.isReloading || this.currentAmmo >= this.currentStats.magazineSize) {
      return;
    }
    this.reloadRemainingSeconds = this.currentStats.reloadSeconds;
  }

  switchTo(weapon: WeaponId): boolean {
    if (!ownsWeapon(this.loadoutState, weapon)) {
      return false;
    }
    if (isMeleeWeapon(weapon)) {
      return this.equipMelee(weapon);
    }
    if (weapon === this.currentWeapon) {
      return false;
    }
    this.currentWeapon = weapon;
    this.reloadRemainingSeconds = 0;
    this.cooldownSeconds = Math.max(this.cooldownSeconds, SWITCH_DELAY_SECONDS);
    if (this.currentAmmo === 0) {
      this.startReload();
    }
    return true;
  }

  unlock(weapon: WeaponId): void {
    this.loadoutState = withWeaponUnlocked(this.loadoutState, weapon);
    if (!isMeleeWeapon(weapon)) {
      this.ammo.set(weapon, this.statsOf(weapon).magazineSize);
    }
    this.switchTo(weapon);
  }

  upgrade(weapon: WeaponId, stat: UpgradeStat): number {
    this.loadoutState = withUpgradeApplied(this.loadoutState, weapon, stat);
    if (isMeleeWeapon(weapon)) {
      this.meleeStatsCache.delete(weapon);
    } else {
      this.rangedStatsCache.delete(weapon);
      this.ammo.set(weapon, this.statsOf(weapon).magazineSize);
    }
    return this.loadoutState.upgrades[weapon][stat];
  }

  refillAll(): void {
    this.reloadRemainingSeconds = 0;
    for (const weapon of RANGED_WEAPON_IDS) {
      if (ownsWeapon(this.loadoutState, weapon)) {
        this.ammo.set(weapon, this.statsOf(weapon).magazineSize);
      }
    }
  }

  private equipMelee(weapon: MeleeWeaponId): boolean {
    if (weapon === this.currentMelee) {
      return false;
    }
    this.currentMelee = weapon;
    this.swingCooldownSeconds = Math.max(this.swingCooldownSeconds, SWITCH_DELAY_SECONDS);
    return true;
  }
}
