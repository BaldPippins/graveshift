import { UpgradeStat, WeaponClass, WeaponId } from '@graveshift/shared/config';
import { KenneyPack, kenneyModel, ModelFit } from '../assets/ModelSpec.ts';
import type { ModelSpec } from '../assets/ModelSpec.ts';

export interface WeaponContent {
  readonly model: ModelSpec;
  readonly color: number;
  readonly gripFraction: number;
  readonly headDown: boolean;
}

function blaster(file: string, size: number, color: number): WeaponContent {
  return {
    model: kenneyModel(KenneyPack.Blasters, file, ModelFit.Longest, size),
    color,
    gripFraction: 0,
    headDown: false,
  };
}

function blade(
  pack: KenneyPack,
  file: string,
  size: number,
  color: number,
  gripFraction: number,
): WeaponContent {
  return {
    model: kenneyModel(pack, file, ModelFit.Height, size),
    color,
    gripFraction,
    headDown: false,
  };
}

function headDown(content: WeaponContent): WeaponContent {
  return { ...content, headDown: true };
}

export const WEAPON_CONTENT: Readonly<Record<WeaponId, WeaponContent>> = {
  [WeaponId.Pistol]: blaster('blaster-a', 0.42, 0xffe08a),
  [WeaponId.Smg]: blaster('blaster-d', 0.55, 0xffb347),
  [WeaponId.Shotgun]: blaster('blaster-l', 0.6, 0xff7b54),
  [WeaponId.Rifle]: blaster('blaster-e', 0.75, 0x9fe7ff),
  [WeaponId.Gatling]: blaster('blaster-p', 0.7, 0xb3ff8a),
  [WeaponId.Shovel]: headDown(blade(KenneyPack.Graveyard, 'shovel', 0.72, 0xd9c7a1, 0.85)),
  [WeaponId.Sword]: blade(KenneyPack.Dungeon, 'weapon-sword', 0.6, 0xdff3ff, 0.18),
  [WeaponId.Spear]: blade(KenneyPack.Dungeon, 'weapon-spear', 1.05, 0xffe2a6, 0.3),
  [WeaponId.Axe]: blade(KenneyPack.Survival, 'tool-axe-upgraded', 0.62, 0xff9d6b, 0.15),
  [WeaponId.Warhammer]: blade(KenneyPack.Survival, 'tool-hammer-upgraded', 0.6, 0xc7b3ff, 0.15),
};

export const UPGRADE_ICONS: Readonly<Record<WeaponClass, Readonly<Record<UpgradeStat, string>>>> = {
  [WeaponClass.Ranged]: {
    [UpgradeStat.Damage]: '💥',
    [UpgradeStat.FireRate]: '⚡',
    [UpgradeStat.Capacity]: '📦',
  },
  [WeaponClass.Melee]: {
    [UpgradeStat.Damage]: '💥',
    [UpgradeStat.FireRate]: '⚡',
    [UpgradeStat.Capacity]: '📏',
  },
};

export const FURY_COLOR = 0xffb02e;
