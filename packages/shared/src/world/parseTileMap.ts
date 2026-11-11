import type { CellCoord } from './CellCoord.ts';
import type { MapDefinition } from './MapDefinition.ts';
import { TileKind, TILE_KINDS } from './TileKind.ts';
import { TileMap } from './TileMap.ts';
import { TILE_TRAITS } from './tileTraits.ts';

const KIND_BY_SYMBOL: ReadonlyMap<string, TileKind> = new Map(
  TILE_KINDS.map((kind) => [TILE_TRAITS[kind].symbol, kind]),
);

export function parseTileMap(definition: MapDefinition): TileMap {
  const height = definition.rows.length;
  const firstRow = definition.rows[0];
  const width = firstRow === undefined ? 0 : firstRow.length;
  if (height === 0 || width === 0) {
    throw new Error(`Map ${definition.id} is empty`);
  }
  const tiles = new Uint8Array(width * height);
  const playerSpawns: CellCoord[] = [];
  const enemySpawns: CellCoord[] = [];

  definition.rows.forEach((row, cy) => {
    if (row.length !== width) {
      throw new Error(
        `Map ${definition.id}: row ${cy} has length ${row.length}, expected ${width}`,
      );
    }
    for (let cx = 0; cx < width; cx += 1) {
      const symbol = row.charAt(cx);
      const kind = KIND_BY_SYMBOL.get(symbol);
      if (kind === undefined) {
        throw new Error(`Map ${definition.id}: unknown symbol "${symbol}" at ${cx},${cy}`);
      }
      tiles[cy * width + cx] = kind;
      if (kind === TileKind.PlayerSpawn) {
        playerSpawns.push({ cx, cy });
      } else if (kind === TileKind.EnemySpawn) {
        enemySpawns.push({ cx, cy });
      }
    }
  });

  if (playerSpawns.length === 0 || enemySpawns.length === 0) {
    throw new Error(`Map ${definition.id} must declare player and enemy spawns`);
  }
  return new TileMap(width, height, tiles, playerSpawns, enemySpawns, definition.orientations);
}
