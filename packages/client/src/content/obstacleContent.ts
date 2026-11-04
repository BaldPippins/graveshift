import type { ValueOf } from '@graveshift/shared/core';
import { TileKind } from '@graveshift/shared/world';
import { ModelKey } from '../assets/ModelKey.ts';
import { PALETTE } from './palette.ts';

export const DamageLook = {
  Cracks: 'cracks',
  Flames: 'flames',
} as const;
export type DamageLook = ValueOf<typeof DamageLook>;

const FLAMMABLE_TILES: ReadonlySet<TileKind> = new Set([TileKind.Pine, TileKind.PineCrooked]);

export function damageLookOf(kind: TileKind): DamageLook {
  return FLAMMABLE_TILES.has(kind) ? DamageLook.Flames : DamageLook.Cracks;
}

const WRECK_MODELS: ReadonlyMap<TileKind, ModelKey> = new Map([
  [TileKind.Pine, ModelKey.PineStump],
  [TileKind.PineCrooked, ModelKey.PineStump],
  [TileKind.Lightpost, ModelKey.StoneDebris],
]);

export function wreckModelOf(kind: TileKind): ModelKey {
  return WRECK_MODELS.get(kind) ?? ModelKey.GraveDebris;
}

export const OBSTACLE_DEBRIS: Readonly<Record<DamageLook, number>> = {
  [DamageLook.Cracks]: PALETTE.stoneDebris,
  [DamageLook.Flames]: PALETTE.ember,
};
