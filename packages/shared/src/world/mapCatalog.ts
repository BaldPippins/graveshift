import { MapId } from './MapDefinition.ts';
import type { MapDefinition } from './MapDefinition.ts';
import { GRAVEYARD_MAP } from './maps/graveyardMap.ts';
import { parseTileMap } from './parseTileMap.ts';
import type { TileMap } from './TileMap.ts';

export const MAP_DEFINITIONS: Readonly<Record<MapId, MapDefinition>> = {
  [MapId.Graveyard]: GRAVEYARD_MAP,
};

const PARSED_MAPS = new Map<MapId, TileMap>();

export function tileMapOf(mapId: MapId): TileMap {
  const cached = PARSED_MAPS.get(mapId);
  if (cached !== undefined) {
    return cached;
  }
  const map = parseTileMap(MAP_DEFINITIONS[mapId]);
  PARSED_MAPS.set(mapId, map);
  return map;
}
