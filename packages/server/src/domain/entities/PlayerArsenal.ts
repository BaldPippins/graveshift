import {
  isMeleeWeapon,
  isRangedWeapon,
  MELEE_WEAPONS,
  RANGED_WEAPON_IDS,
  RANGED_WEAPONS,
  STARTING_WEAPONS,
  WEAPON_IDS,
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
  private loadoutState: LoadoutState;
  readonly allowedWeapons: readonly WeaponId[];
  private readonly modifiers: HeroModifiers;
  private readonly rangedStatsCache = new Map<RangedWeaponId, RangedStats>();
  private readonly meleeStatsCache = new Map<MeleeWeaponId, MeleeStats>();
  private readonly ammo = new Map<RangedWeaponId, number>();
  private currentWeapon: RangedWeaponId | null;
  private currentMelee: MeleeWeaponId | null;
  private cooldownSeconds = 0;
  private swingCooldownSeconds = 0;
  private reloadRemainingSeconds = 0;
  private reloadDurationSeconds = 0;

  constructor(
    modifiers: HeroModifiers,
    starting: readonly WeaponId[] = STARTING_WEAPONS,
    allowed: readonly WeaponId[] = WEAPON_IDS,
  ) {
    this.modifiers = modifiers;
    this.allowedWeapons = allowed;
    this.loadoutState = createStartingLoadout(starting);
    this.currentWeapon = starting.find(isRangedWeapon) ?? null;
    this.currentMelee = starting.find(isMeleeWeapon) ?? null;
    this.refillAll();
  }

  get loadout(): LoadoutState {
    return this.loadoutState;
  }

  get current(): RangedWeaponId | null {
    return this.currentWeapon;
  }

  get currentStats(): RangedStats {
    if (this.currentWeapon === null) {
      throw new Error('No ranged weapon equipped');
    }
    return this.statsOf(this.currentWeapon);
  }

  get melee(): MeleeWeaponId | null {
    return this.currentMelee;
  }

  get meleeStats(): MeleeStats {
    if (this.currentMelee === null) {
      throw new Error('No melee weapon equipped');
    }
    return this.meleeStatsOf(this.currentMelee);
  }

  get currentAmmo(): number {
    return this.currentWeapon === null ? 0 : (this.ammo.get(this.currentWeapon) ?? 0);
  }

  get isReloading(): boolean {
    return this.reloadRemainingSeconds > 0;
  }

  get reloadProgress(): number {
    if (!this.isReloading) {
      return 0;
    }
    return Math.max(0, Math.min(1, 1 - this.reloadRemainingSeconds / this.reloadDurationSeconds));
  }

  get isReadyToFire(): boolean {
    return this.currentWeapon !== null && this.cooldownSeconds <= 0 && !this.isReloading;
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
      if (this.reloadRemainingSeconds <= 0 && this.currentWeapon !== null) {
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
    if (!this.isReadyToFire || this.currentWeapon === null) {
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
    if (this.currentMelee === null || this.swingCooldownSeconds > 0) {
      return false;
    }
    this.swingCooldownSeconds += this.meleeStats.swingSeconds;
    return true;
  }

  startReload(): void {
    if (
      this.currentWeapon === null ||
      this.isReloading ||
      this.currentAmmo >= this.currentStats.magazineSize
    ) {
      return;
    }
    this.reloadDurationSeconds = this.currentStats.reloadSeconds;
    this.reloadRemainingSeconds = this.reloadDurationSeconds;
  }

  switchTo(weapon: WeaponId): boolean {
    if (!this.allowedWeapons.includes(weapon) || !ownsWeapon(this.loadoutState, weapon)) {
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
    if (!this.allowedWeapons.includes(weapon)) {
      return;
    }
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
