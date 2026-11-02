import { CollisionLayer } from './CollisionLayer.ts';
import { TileKind } from './TileKind.ts';

export interface TileTraits {
  readonly symbol: string;
  readonly blocks: Readonly<Record<CollisionLayer, boolean>>;
}

function traits(symbol: string, blocksMovement: boolean, blocksProjectiles: boolean): TileTraits {
  return {
    symbol,
    blocks: {
      [CollisionLayer.Movement]: blocksMovement,
      [CollisionLayer.Projectiles]: blocksProjectiles,
    },
  };
}

export const TILE_TRAITS: Readonly<Record<TileKind, TileTraits>> = {
  [TileKind.Grass]: traits('.', false, false),
  [TileKind.Road]: traits('=', false, false),
  [TileKind.Wall]: traits('#', true, true),
  [TileKind.Fence]: traits('F', true, true),
  [TileKind.Pine]: traits('T', true, true),
  [TileKind.PineCrooked]: traits('t', true, true),
  [TileKind.GraveRound]: traits('g', true, true),
  [TileKind.GraveCross]: traits('h', true, true),
  [TileKind.GraveBroken]: traits('b', true, true),
  [TileKind.GraveWide]: traits('w', true, true),
  [TileKind.GraveDecorative]: traits('d', true, true),
  [TileKind.Crypt]: traits('C', true, true),
  [TileKind.Lightpost]: traits('L', true, true),
  [TileKind.PumpkinPatch]: traits('u', false, false),
  [TileKind.Rocks]: traits('r', true, true),
  [TileKind.Coffin]: traits('c', true, true),
  [TileKind.EnemySpawn]: traits('S', false, false),
  [TileKind.PlayerSpawn]: traits('P', false, false),
  [TileKind.Merchant]: traits('K', true, false),
  [TileKind.FireBasket]: traits('f', true, true),
  [TileKind.Candles]: traits('x', false, false),
};
