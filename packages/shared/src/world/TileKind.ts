import type { ValueOf } from '../core/ValueOf.ts';

export const TileKind = {
  Grass: 0,
  Road: 1,
  Wall: 2,
  Fence: 3,
  Pine: 4,
  PineCrooked: 5,
  GraveRound: 6,
  GraveCross: 7,
  GraveBroken: 8,
  GraveWide: 9,
  GraveDecorative: 10,
  Crypt: 11,
  Lightpost: 12,
  PumpkinPatch: 13,
  Rocks: 14,
  Coffin: 15,
  EnemySpawn: 16,
  PlayerSpawn: 17,
  Merchant: 18,
  FireBasket: 19,
  Candles: 20,
  PowderKegSpot: 21,
  BearTrapSpot: 22,
} as const;
export type TileKind = ValueOf<typeof TileKind>;
export const TILE_KINDS: readonly TileKind[] = Object.values(TileKind);
