import { describe, expect, it } from 'vitest';
import { HEROES, HeroId } from '../config/heroes.ts';
import { MERCHANT_RULES } from '../config/merchant.ts';
import { UpgradeStat, UPGRADES } from '../config/upgrades.ts';
import { MELEE_WEAPONS, RANGED_WEAPONS, WEAPONS, WeaponId } from '../config/weapons.ts';
import { LifeState } from '../model/LifeState.ts';
import type { PlayerMatchStats } from '../model/PlayerMatchStats.ts';
import { matchScore } from './matchScore.ts';
import { createStartingLoadout, withUpgradeApplied, withWeaponUnlocked } from './loadoutRules.ts';
import { furiousMeleeStats, furyChargeFraction } from './meleeRules.ts';
import { resolveMeleeStats, resolveWeaponStats } from './upgradeRules.ts';
import { MerchantAccess } from './MerchantAccess.ts';
import { merchantAccessFor } from './merchantRules.ts';
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
      RANGED_WEAPONS[WeaponId.Pistol],
      levels,
      HEROES[HeroId.Watchman].modifiers,
    );
    const base = RANGED_WEAPONS[WeaponId.Pistol].stats;
    expect(stats.damage).toBeCloseTo(base.damage * 1.44 * 1.15);
    expect(stats.fireIntervalSeconds).toBeLessThan(base.fireIntervalSeconds);
    expect(stats.magazineSize).toBeGreaterThan(base.magazineSize);
  });
});

describe('merchant revival', () => {
  const graveside: PurchaseContext = {
    loadout: createStartingLoadout(),
    coins: 500,
    health: 100,
    maxHealth: 100,
    lifeState: LifeState.Alive,
    merchantAccess: MerchantAccess.Grave,
  };
  const revive = { kind: ShopOfferKind.ReviveMerchant } as const;

  it('sells a revival only at the grave of a dead merchant', () => {
    expect(quotePurchase(revive, graveside)).toEqual({
      price: MERCHANT_RULES.revivePrice,
      rejection: null,
    });
    expect(
      quotePurchase(revive, { ...graveside, merchantAccess: MerchantAccess.Gone }).rejection,
    ).toBe(PurchaseRejection.MerchantTooFar);
    expect(
      quotePurchase(revive, { ...graveside, merchantAccess: MerchantAccess.Serving }).rejection,
    ).toBe(PurchaseRejection.MerchantAlive);
    expect(quotePurchase(revive, { ...graveside, coins: 10 }).rejection).toBe(
      PurchaseRejection.NotEnoughCoins,
    );
  });

  it('keeps the rest of the shop closed at the grave', () => {
    expect(
      quotePurchase({ kind: ShopOfferKind.Heal }, { ...graveside, health: 10 }).rejection,
    ).toBe(PurchaseRejection.MerchantGone);
  });

  it('tells the grave apart from a distant dead merchant', () => {
    const spot = { x: 10, y: 10 };
    expect(merchantAccessFor({ x: 11, y: 10 }, spot, false)).toBe(MerchantAccess.Grave);
    expect(merchantAccessFor({ x: 20, y: 10 }, spot, false)).toBe(MerchantAccess.Gone);
    expect(merchantAccessFor({ x: 11, y: 10 }, spot, true)).toBe(MerchantAccess.Serving);
  });
});

describe('melee weapons', () => {
  it('starts every hero with a pistol and a shovel', () => {
    expect(createStartingLoadout().ownedWeapons).toEqual([WeaponId.Pistol, WeaponId.Shovel]);
  });

  it('sells and upgrades melee weapons like guns', () => {
    const context: PurchaseContext = {
      loadout: createStartingLoadout(),
      coins: 1000,
      health: 100,
      maxHealth: 100,
      lifeState: LifeState.Alive,
      merchantAccess: MerchantAccess.Serving,
    };
    expect(
      quotePurchase({ kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Axe }, context),
    ).toEqual({ price: WEAPONS[WeaponId.Axe].unlockPrice, rejection: null });
    const upgrade = {
      kind: ShopOfferKind.UpgradeWeapon,
      weapon: WeaponId.Shovel,
      stat: UpgradeStat.Capacity,
    } as const;
    expect(quotePurchase(upgrade, context).rejection).toBeNull();
  });

  it('grows damage, swing speed and reach with upgrades', () => {
    const levels = {
      [UpgradeStat.Damage]: 1,
      [UpgradeStat.FireRate]: 1,
      [UpgradeStat.Capacity]: 2,
    };
    const base = MELEE_WEAPONS[WeaponId.Sword].stats;
    const stats = resolveMeleeStats(
      MELEE_WEAPONS[WeaponId.Sword],
      levels,
      HEROES[HeroId.Pippin].modifiers,
    );
    expect(stats.damage).toBeGreaterThan(base.damage);
    expect(stats.swingSeconds).toBeLessThan(base.swingSeconds);
    expect(stats.reach).toBeCloseTo(base.reach * 1.2);
    expect(stats.arcRadians).toBeGreaterThan(base.arcRadians);
  });

  it('doubles damage and widens the swing while furious', () => {
    const base = MELEE_WEAPONS[WeaponId.Warhammer].stats;
    const furious = furiousMeleeStats(base);
    expect(furious.damage).toBe(base.damage * 2);
    expect(furious.reach).toBeGreaterThan(base.reach);
    expect(furious.arcRadians).toBeLessThanOrEqual(Math.PI * 2);
    expect(furyChargeFraction(5)).toBe(0.5);
    expect(furyChargeFraction(15)).toBe(1);
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
