import type { EnemyKind, WeaponId } from '@graveshift/shared/config';
import type { ValueOf } from '@graveshift/shared/core';

export const ModelKey = {
  HeroPippin: 'hero-pippin',
  HeroWatchman: 'hero-watchman',
  HeroLamplighter: 'hero-lamplighter',
  HeroUndertaker: 'hero-undertaker',
  HeroAgatha: 'hero-agatha',
  Keeper: 'keeper',
  GraveRound: 'grave-round',
  GraveCross: 'grave-cross',
  GraveBroken: 'grave-broken',
  GraveWide: 'grave-wide',
  GraveDecorative: 'grave-decorative',
  Crypt: 'crypt',
  Pine: 'pine',
  PineCrooked: 'pine-crooked',
  IronFence: 'iron-fence',
  StoneWall: 'stone-wall',
  Lightpost: 'lightpost',
  Pumpkin: 'pumpkin',
  Rocks: 'rocks',
  GraveDebris: 'grave-debris',
  PineStump: 'pine-stump',
  StoneDebris: 'stone-debris',
  Coffin: 'coffin',
  OpenGrave: 'open-grave',
  FireBasket: 'fire-basket',
  Candles: 'candles',
  Coin: 'coin',
  Potion: 'potion',
  PowderKeg: 'powder-keg',
  BearTrapOpen: 'bear-trap-open',
  BearTrapClosed: 'bear-trap-closed',
} as const;
export type StaticModelKey = ValueOf<typeof ModelKey>;
export type WeaponModelKey = `weapon-${WeaponId}`;
export type EnemyModelKey = `enemy-${EnemyKind}`;
export type ModelKey = StaticModelKey | WeaponModelKey | EnemyModelKey;

export function weaponModelKey(weapon: WeaponId): WeaponModelKey {
  return `weapon-${weapon}`;
}

export function enemyModelKey(kind: EnemyKind): EnemyModelKey {
  return `enemy-${kind}`;
}
