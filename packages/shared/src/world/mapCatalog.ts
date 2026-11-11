import { MapId } from './MapDefinition.ts';
import type { MapDefinition } from './MapDefinition.ts';
import { GRAVEYARD_MAP } from './maps/graveyardMap.ts';
export { GRAVEYARD_LEVEL } from './maps/graveyardMap.ts';
import { parseTileMap } from './parseTileMap.ts';
import type { TileMap } from './TileMap.ts';

export const MAP_DEFINITIONS: Readonly<Record<MapId, MapDefinition>> = {
  [MapId.Graveyard]: GRAVEYARD_MAP,
};

export function tileMapOf(mapId: MapId): TileMap {
  return parseTileMap(MAP_DEFINITIONS[mapId]);
}
