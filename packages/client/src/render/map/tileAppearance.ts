import type { ValueOf } from '@graveshift/shared/core';
import { TileKind } from '@graveshift/shared/world';
import { ModelKey } from '../../assets/ModelKey.ts';
import { PALETTE } from '../../content/palette.ts';

export const TileOrientation = {
  Fixed: 'fixed',
  AlongNeighbors: 'along-neighbors',
  Jitter: 'jitter',
  Random: 'random',
} as const;
export type TileOrientation = ValueOf<typeof TileOrientation>;

export interface TileGlow {
  readonly color: number;
  readonly height: number;
  readonly size: number;
  readonly castsLight: boolean;
}

export interface TileAppearance {
  readonly model: ModelKey;
  readonly orientation: TileOrientation;
  readonly glow: TileGlow | null;
}

function look(
  model: ModelKey,
  orientation: TileOrientation,
  glow: TileGlow | null = null,
): TileAppearance {
  return { model, orientation, glow };
}

function lampGlow(color: number): TileGlow {
  return { color, height: 1.87, size: 1.6, castsLight: true };
}

function fireGlow(color: number): TileGlow {
  return { color, height: 0.55, size: 1.6, castsLight: true };
}

function emberGlow(color: number): TileGlow {
  return { color, height: 0.55, size: 0.96, castsLight: false };
}

export const PATH_TILES: ReadonlySet<TileKind> = new Set([
  TileKind.Road,
  TileKind.PlayerSpawn,
  TileKind.EnemySpawn,
  TileKind.PumpkinPatch,
]);

export const TILE_APPEARANCE: Readonly<Record<TileKind, TileAppearance | null>> = {
  [TileKind.Grass]: null,
  [TileKind.Road]: null,
  [TileKind.Wall]: look(ModelKey.StoneWall, TileOrientation.AlongNeighbors),
  [TileKind.Fence]: look(ModelKey.IronFence, TileOrientation.AlongNeighbors),
  [TileKind.Pine]: look(ModelKey.Pine, TileOrientation.Random),
  [TileKind.PineCrooked]: look(ModelKey.PineCrooked, TileOrientation.Random),
  [TileKind.GraveRound]: look(ModelKey.GraveRound, TileOrientation.Jitter),
  [TileKind.GraveCross]: look(ModelKey.GraveCross, TileOrientation.Jitter),
  [TileKind.GraveBroken]: look(ModelKey.GraveBroken, TileOrientation.Jitter),
  [TileKind.GraveWide]: look(ModelKey.GraveWide, TileOrientation.Jitter),
  [TileKind.GraveDecorative]: look(ModelKey.GraveDecorative, TileOrientation.Jitter),
  [TileKind.Crypt]: look(ModelKey.Crypt, TileOrientation.Fixed),
  [TileKind.Lightpost]: look(ModelKey.Lightpost, TileOrientation.Fixed, lampGlow(0xffd27a)),
  [TileKind.PumpkinPatch]: null,
  [TileKind.Rocks]: look(ModelKey.Rocks, TileOrientation.Random),
  [TileKind.Coffin]: look(ModelKey.Coffin, TileOrientation.Jitter),
  [TileKind.EnemySpawn]: look(
    ModelKey.OpenGrave,
    TileOrientation.Fixed,
    emberGlow(PALETTE.reviveGreen),
  ),
  [TileKind.PlayerSpawn]: null,
  [TileKind.Merchant]: null,
  [TileKind.FireBasket]: look(ModelKey.FireBasket, TileOrientation.Fixed, fireGlow(0xff7a2a)),
  [TileKind.Candles]: look(ModelKey.Candles, TileOrientation.Random, emberGlow(0xffc46b)),
  [TileKind.PowderKegSpot]: null,
  [TileKind.BearTrapSpot]: null,
};
