import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, UpgradeStat, WEAPONS, WeaponId } from '@graveshift/shared/config';
import { PlayerArsenal } from './PlayerArsenal.ts';

describe('PlayerArsenal', () => {
  it('respects fire interval and reloads an empty magazine', () => {
    const arsenal = new PlayerArsenal(HEROES[HeroId.Pippin].modifiers);
    const pistol = WEAPONS[WeaponId.Pistol].stats;
    expect(arsenal.consumeShot()).toBe(true);
    expect(arsenal.consumeShot()).toBe(false);
    arsenal.advance(pistol.fireIntervalSeconds, true);
    expect(arsenal.consumeShot()).toBe(true);

    for (let shot = 2; shot < pistol.magazineSize; shot += 1) {
      arsenal.advance(pistol.fireIntervalSeconds, true);
      expect(arsenal.consumeShot()).toBe(true);
    }
    expect(arsenal.currentAmmo).toBe(0);
    expect(arsenal.isReloading).toBe(true);
    arsenal.advance(pistol.reloadSeconds + 0.01, false);
    expect(arsenal.currentAmmo).toBe(pistol.magazineSize);
  });

  it('cannot switch to locked weapons and auto-equips purchases', () => {
    const arsenal = new PlayerArsenal(HEROES[HeroId.Pippin].modifiers);
    expect(arsenal.switchTo(WeaponId.Rifle)).toBe(false);
    arsenal.unlock(WeaponId.Rifle);
    expect(arsenal.current).toBe(WeaponId.Rifle);
    expect(arsenal.currentAmmo).toBe(WEAPONS[WeaponId.Rifle].stats.magazineSize);
  });

  it('applies capacity upgrades to the magazine', () => {
    const arsenal = new PlayerArsenal(HEROES[HeroId.Pippin].modifiers);
    const before = arsenal.currentStats.magazineSize;
    expect(arsenal.upgrade(WeaponId.Pistol, UpgradeStat.Capacity)).toBe(1);
    expect(arsenal.currentStats.magazineSize).toBeGreaterThan(before);
    expect(arsenal.currentAmmo).toBe(arsenal.currentStats.magazineSize);
  });
});
