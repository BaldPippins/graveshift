import type { ValueOf } from '../core/ValueOf.ts';
import type { CellOrientation } from './LevelGeometry.ts';

export const MapId = {
  Graveyard: 0,
} as const;
export type MapId = ValueOf<typeof MapId>;
export const MAP_IDS: readonly MapId[] = Object.values(MapId);

export interface MapDefinition {
  readonly id: string | number;
  readonly rows: readonly string[];
  readonly orientations?: readonly CellOrientation[];
}
