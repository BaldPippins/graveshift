import { CollisionLayer } from './CollisionLayer.ts';
import { TileKind } from './TileKind.ts';

export interface TileTraits {
  readonly symbol: string;
  readonly blocks: Readonly<Record<CollisionLayer, boolean>>;
  readonly height: number;
  readonly durability: number | null;
}

const FLAT = 0;
const TOWERING = Number.POSITIVE_INFINITY;

function traits(
  symbol: string,
  blocksMovement: boolean,
  blocksProjectiles: boolean,
  height: number,
  durability: number | null = null,
): TileTraits {
  return {
    symbol,
    blocks: {
      [CollisionLayer.Movement]: blocksMovement,
      [CollisionLayer.Projectiles]: blocksProjectiles,
    },
    height,
    durability,
  };
}

export const TILE_TRAITS: Readonly<Record<TileKind, TileTraits>> = {
  [TileKind.Grass]: traits('.', false, false, FLAT),
  [TileKind.Road]: traits('=', false, false, FLAT),
  [TileKind.Wall]: traits('#', true, true, TOWERING),
  [TileKind.Fence]: traits('F', true, true, 0.55),
  [TileKind.Pine]: traits('T', true, true, TOWERING, 420),
  [TileKind.PineCrooked]: traits('t', true, true, TOWERING, 360),
  [TileKind.GraveRound]: traits('g', true, true, 0.5, 260),
  [TileKind.GraveCross]: traits('h', true, true, 0.55, 220),
  [TileKind.GraveBroken]: traits('b', true, true, 0.4, 160),
  [TileKind.GraveWide]: traits('w', true, true, 0.5, 320),
  [TileKind.GraveDecorative]: traits('d', true, true, 0.6, 300),
  [TileKind.Crypt]: traits('C', true, true, TOWERING),
  [TileKind.Lightpost]: traits('L', true, true, TOWERING, 380),
  [TileKind.PumpkinPatch]: traits('u', false, false, FLAT),
  [TileKind.Rocks]: traits('r', true, true, 0.4),
  [TileKind.Coffin]: traits('c', true, true, 0.35),
  [TileKind.EnemySpawn]: traits('S', false, false, FLAT),
  [TileKind.PlayerSpawn]: traits('P', false, false, FLAT),
  [TileKind.Merchant]: traits('K', false, false, FLAT),
  [TileKind.FireBasket]: traits('f', true, true, TOWERING),
  [TileKind.Candles]: traits('x', false, false, FLAT),
  [TileKind.PowderKegSpot]: traits('k', true, false, 0.7),
  [TileKind.BearTrapSpot]: traits('n', false, false, FLAT),
};

export function isDestructibleTile(kind: TileKind): boolean {
  return TILE_TRAITS[kind].durability !== null;
}
