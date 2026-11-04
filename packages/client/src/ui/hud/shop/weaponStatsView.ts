import {
  HEROES,
  isMeleeWeapon,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  UpgradeStat,
  WeaponClass,
} from '@graveshift/shared/config';
import type {
  HeroId,
  MeleeStats,
  MeleeWeaponId,
  RangedStats,
  RangedWeaponId,
  UpgradeLevels,
  WeaponId,
} from '@graveshift/shared/config';
import { resolveMeleeStats, resolveWeaponStats } from '@graveshift/shared/rules';
import type { Messages, ShopTexts } from '../../../i18n/Messages.ts';

export interface StatChip {
  readonly value: string;
  readonly label: string;
}

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function rangedDamage(stats: RangedStats): string {
  const damage = String(Math.round(stats.damage));
  return stats.pellets > 1 ? `${damage}×${stats.pellets}` : damage;
}

function rangedChips(stats: RangedStats, text: ShopTexts): readonly StatChip[] {
  const damagePerSecond = (stats.damage * stats.pellets) / stats.fireIntervalSeconds;
  const chips: StatChip[] = [
    { value: rangedDamage(stats), label: text.damageLabel },
    { value: String(Math.round(damagePerSecond)), label: text.dpsLabel },
    { value: String(stats.magazineSize), label: text.magazineLabel },
  ];
  if (stats.pierce > 0) {
    chips.push({ value: String(stats.pierce + 1), label: text.pierceLabel });
  }
  return chips;
}

function meleeChips(stats: MeleeStats, text: ShopTexts): readonly StatChip[] {
  return [
    { value: String(Math.round(stats.damage)), label: text.damageLabel },
    { value: String(Math.round(stats.damage / stats.swingSeconds)), label: text.dpsLabel },
    { value: text.reach(stats.reach), label: text.reachLabel },
    { value: text.arc(degrees(stats.arcRadians)), label: text.arcLabel },
    { value: text.percent(stats.critChance), label: text.critLabel },
  ];
}

function rangedStatValue(stat: UpgradeStat, stats: RangedStats, text: ShopTexts): string {
  switch (stat) {
    case UpgradeStat.Damage:
      return rangedDamage(stats);
    case UpgradeStat.FireRate:
      return text.rate(1 / stats.fireIntervalSeconds);
    case UpgradeStat.Capacity:
      return String(stats.magazineSize);
  }
}

function meleeStatValue(stat: UpgradeStat, stats: MeleeStats, text: ShopTexts): string {
  switch (stat) {
    case UpgradeStat.Damage:
      return String(Math.round(stats.damage));
    case UpgradeStat.FireRate:
      return text.rate(1 / stats.swingSeconds);
    case UpgradeStat.Capacity:
      return text.percent(stats.critChance);
  }
}

interface ResolvedRanged {
  readonly weaponClass: typeof WeaponClass.Ranged;
  readonly weapon: RangedWeaponId;
  readonly stats: RangedStats;
}

interface ResolvedMelee {
  readonly weaponClass: typeof WeaponClass.Melee;
  readonly weapon: MeleeWeaponId;
  readonly stats: MeleeStats;
}

type ResolvedWeapon = ResolvedRanged | ResolvedMelee;

export interface WeaponLabel {
  readonly name: string;
  readonly description: string;
}

function resolve(weapon: WeaponId, levels: UpgradeLevels, hero: HeroId): ResolvedWeapon {
  const modifiers = HEROES[hero].modifiers;
  if (isMeleeWeapon(weapon)) {
    return {
      weaponClass: WeaponClass.Melee,
      weapon,
      stats: resolveMeleeStats(MELEE_WEAPONS[weapon], levels, modifiers),
    };
  }
  return {
    weaponClass: WeaponClass.Ranged,
    weapon,
    stats: resolveWeaponStats(RANGED_WEAPONS[weapon], levels, modifiers),
  };
}

export function weaponChips(
  weapon: WeaponId,
  levels: UpgradeLevels,
  hero: HeroId,
  text: ShopTexts,
): readonly StatChip[] {
  const resolved = resolve(weapon, levels, hero);
  return resolved.weaponClass === WeaponClass.Melee
    ? meleeChips(resolved.stats, text)
    : rangedChips(resolved.stats, text);
}

export function upgradeStatValue(
  weapon: WeaponId,
  stat: UpgradeStat,
  levels: UpgradeLevels,
  hero: HeroId,
  text: ShopTexts,
): string {
  const resolved = resolve(weapon, levels, hero);
  return resolved.weaponClass === WeaponClass.Melee
    ? meleeStatValue(stat, resolved.stats, text)
    : rangedStatValue(stat, resolved.stats, text);
}

export function weaponLabel(
  weapon: WeaponId,
  levels: UpgradeLevels,
  hero: HeroId,
  messages: Messages,
): WeaponLabel {
  const resolved = resolve(weapon, levels, hero);
  if (resolved.weaponClass === WeaponClass.Melee) {
    const texts = messages.meleeWeapons[resolved.weapon];
    return { name: texts.name, description: texts.description(resolved.stats) };
  }
  const texts = messages.weapons[resolved.weapon];
  return { name: texts.name, description: texts.description(resolved.stats) };
}
