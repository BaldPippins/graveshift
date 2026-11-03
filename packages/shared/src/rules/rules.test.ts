import { describe, expect, it } from 'vitest';
import { HEROES, HeroId } from '../config/heroes.ts';
import { UpgradeStat, UPGRADES } from '../config/upgrades.ts';
import { WEAPONS, WeaponId } from '../config/weapons.ts';
import { LifeState } from '../model/LifeState.ts';
import type { PlayerMatchStats } from '../model/PlayerMatchStats.ts';
import { matchScore } from './matchScore.ts';
import { createStartingLoadout, withUpgradeApplied, withWeaponUnlocked } from './loadoutRules.ts';
import { resolveWeaponStats } from './upgradeRules.ts';
import { MerchantAccess } from './MerchantAccess.ts';
import { PurchaseRejection } from './PurchaseRejection.ts';
import { ShopOfferKind } from './ShopOffer.ts';
import { quotePurchase } from './shopRules.ts';
import type { PurchaseContext } from './shopRules.ts';
import { enemyHealthMultiplier, spawnIntervalSeconds, waveBudget } from './waveRules.ts';

const baseContext: PurchaseContext = {
  loadout: createStartingLoadout(),
  coins: 1000,
  health: 50,
  maxHealth: 100,
  lifeState: LifeState.Alive,
  merchantAccess: MerchantAccess.Serving,
};

describe('shop rules', () => {
  it('quotes an affordable weapon unlock', () => {
    const quote = quotePurchase(
      { kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Smg },
      baseContext,
    );
    expect(quote).toEqual({ price: WEAPONS[WeaponId.Smg].unlockPrice, rejection: null });
  });

  it('rejects in priority order', () => {
    const offer = { kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Gatling } as const;
    expect(
      quotePurchase(offer, { ...baseContext, merchantAccess: MerchantAccess.TooFar }).rejection,
    ).toBe(PurchaseRejection.MerchantTooFar);
    expect(quotePurchase(offer, { ...baseContext, lifeState: LifeState.Downed }).rejection).toBe(
      PurchaseRejection.NotAlive,
    );
    expect(quotePurchase(offer, { ...baseContext, coins: 1 }).rejection).toBe(
      PurchaseRejection.NotEnoughCoins,
    );
  });

  it('requires owning a weapon before upgrading and caps levels', () => {
    const upgradeSmg = {
      kind: ShopOfferKind.UpgradeWeapon,
      weapon: WeaponId.Smg,
      stat: UpgradeStat.Damage,
    } as const;
    expect(quotePurchase(upgradeSmg, baseContext).rejection).toBe(PurchaseRejection.WeaponLocked);

    let loadout = withWeaponUnlocked(baseContext.loadout, WeaponId.Smg);
    for (let level = 0; level < UPGRADES[UpgradeStat.Damage].maxLevel; level += 1) {
      expect(quotePurchase(upgradeSmg, { ...baseContext, loadout }).rejection).toBeNull();
      loadout = withUpgradeApplied(loadout, WeaponId.Smg, UpgradeStat.Damage);
    }
    expect(quotePurchase(upgradeSmg, { ...baseContext, loadout }).rejection).toBe(
      PurchaseRejection.MaxLevel,
    );
  });

  it('upgrade prices grow with level', () => {
    const offer = {
      kind: ShopOfferKind.UpgradeWeapon,
      weapon: WeaponId.Pistol,
      stat: UpgradeStat.FireRate,
    } as const;
    const first = quotePurchase(offer, baseContext).price;
    const loadout = withUpgradeApplied(baseContext.loadout, WeaponId.Pistol, UpgradeStat.FireRate);
    expect(quotePurchase(offer, { ...baseContext, loadout }).price).toBeGreaterThan(first);
  });

  it('refuses healing at full health', () => {
    expect(
      quotePurchase({ kind: ShopOfferKind.Heal }, { ...baseContext, health: 100 }).rejection,
    ).toBe(PurchaseRejection.FullHealth);
  });
});

describe('weapon stats', () => {
  it('applies upgrades and hero modifiers', () => {
    const levels = {
      [UpgradeStat.Damage]: 2,
      [UpgradeStat.FireRate]: 1,
      [UpgradeStat.Capacity]: 1,
    };
    const stats = resolveWeaponStats(
      WEAPONS[WeaponId.Pistol],
      levels,
      HEROES[HeroId.Watchman].modifiers,
    );
    const base = WEAPONS[WeaponId.Pistol].stats;
    expect(stats.damage).toBeCloseTo(base.damage * 1.44 * 1.15);
    expect(stats.fireIntervalSeconds).toBeLessThan(base.fireIntervalSeconds);
    expect(stats.magazineSize).toBeGreaterThan(base.magazineSize);
  });
});

describe('wave rules', () => {
  it('scales difficulty with wave and party size', () => {
    expect(waveBudget(2, 1)).toBeGreaterThan(waveBudget(1, 1));
    expect(waveBudget(1, 4)).toBeGreaterThan(waveBudget(1, 1));
    expect(enemyHealthMultiplier(1, 1)).toBe(1);
    expect(spawnIntervalSeconds(100)).toBeGreaterThan(0);
  });
});

const quietShift: PlayerMatchStats = {
  playerId: 1,
  nickname: 'Tester',
  hero: HeroId.Pippin,
  kills: 0,
  bossKills: 0,
  damageDealt: 0,
  damageTaken: 0,
  shotsFired: 0,
  shotsHit: 0,
  revives: 0,
  downs: 0,
  deaths: 0,
  coinsEarned: 0,
};

describe('match score', () => {
  it('rewards kills, bosses, coins and revives', () => {
    const base = matchScore({ ...quietShift, kills: 10 });
    expect(matchScore({ ...quietShift, kills: 10, bossKills: 1 })).toBeGreaterThan(base);
    expect(matchScore({ ...quietShift, kills: 10, coinsEarned: 100 })).toBeGreaterThan(base);
    expect(matchScore({ ...quietShift, kills: 10, revives: 1 })).toBeGreaterThan(base);
  });

  it('punishes downs and deaths but never goes below zero', () => {
    const base = matchScore({ ...quietShift, kills: 20 });
    expect(matchScore({ ...quietShift, kills: 20, downs: 1 })).toBeLessThan(base);
    expect(matchScore({ ...quietShift, kills: 20, downs: 1, deaths: 1 })).toBeLessThan(
      matchScore({ ...quietShift, kills: 20, downs: 1 }),
    );
    expect(matchScore({ ...quietShift, deaths: 5 })).toBe(0);
  });

  it('pays for accuracy only once enough shots were fired', () => {
    const lucky = matchScore({ ...quietShift, shotsFired: 1, shotsHit: 1 });
    const sharp = matchScore({ ...quietShift, shotsFired: 200, shotsHit: 180 });
    const sloppy = matchScore({ ...quietShift, shotsFired: 200, shotsHit: 40 });
    expect(lucky).toBeLessThan(sloppy);
    expect(sharp).toBeGreaterThan(sloppy);
  });
});
