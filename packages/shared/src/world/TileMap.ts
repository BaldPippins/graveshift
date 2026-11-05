import type { Vec2 } from '../core/Vec2.ts';
import type { CellCoord } from './CellCoord.ts';
import { cellCenter } from './cellMath.ts';
import type { CollisionLayer } from './CollisionLayer.ts';
import { TileKind } from './TileKind.ts';
import { TILE_TRAITS } from './tileTraits.ts';

export class TileMap {
  readonly width: number;
  readonly height: number;
  readonly playerSpawns: readonly CellCoord[];
  readonly enemySpawns: readonly CellCoord[];
  private readonly tiles: Uint8Array;
  private readonly clearedCells: Uint8Array;

  constructor(
    width: number,
    height: number,
    tiles: Uint8Array,
    playerSpawns: readonly CellCoord[],
    enemySpawns: readonly CellCoord[],
  ) {
    if (tiles.length !== width * height) {
      throw new RangeError(`Tile buffer size ${tiles.length} does not match ${width}x${height}`);
    }
    this.width = width;
    this.height = height;
    this.tiles = tiles;
    this.clearedCells = new Uint8Array(tiles.length);
    this.playerSpawns = playerSpawns;
    this.enemySpawns = enemySpawns;
  }

  get cellCount(): number {
    return this.tiles.length;
  }

  isInside(cx: number, cy: number): boolean {
    return cx >= 0 && cy >= 0 && cx < this.width && cy < this.height;
  }

  indexOf(cx: number, cy: number): number {
    return cy * this.width + cx;
  }

  cellOfIndex(index: number): CellCoord {
    return { cx: index % this.width, cy: Math.floor(index / this.width) };
  }

  kindAt(cx: number, cy: number): TileKind {
    if (!this.isInside(cx, cy)) {
      return TileKind.Wall;
    }
    return (this.tiles[this.indexOf(cx, cy)] ?? TileKind.Wall) as TileKind;
  }

  playerSpawnPoint(index: number): Vec2 {
    const cell = this.playerSpawns[index % this.playerSpawns.length];
    if (cell === undefined) {
      throw new Error('Map has no player spawns');
    }
    return cellCenter(cell);
  }

  cellsOfKind(kind: TileKind): CellCoord[] {
    const cells: CellCoord[] = [];
    this.tiles.forEach((tile, index) => {
      if (tile === kind) {
        cells.push(this.cellOfIndex(index));
      }
    });
    return cells;
  }

  setCellCleared(cell: CellCoord, cleared: boolean): void {
    if (this.isInside(cell.cx, cell.cy)) {
      this.setIndexCleared(this.indexOf(cell.cx, cell.cy), cleared);
    }
  }

  setIndexCleared(index: number, cleared: boolean): void {
    if (index >= 0 && index < this.clearedCells.length) {
      this.clearedCells[index] = cleared ? 1 : 0;
    }
  }

  isIndexCleared(index: number): boolean {
    return this.clearedCells[index] === 1;
  }

  isBlocked(cx: number, cy: number, layer: CollisionLayer): boolean {
    if (!this.isInside(cx, cy)) {
      return TILE_TRAITS[TileKind.Wall].blocks[layer];
    }
    return this.isBlockedAtIndex(this.indexOf(cx, cy), layer);
  }

  isBlockedAbove(cx: number, cy: number, layer: CollisionLayer, clearance: number): boolean {
    return this.isBlocked(cx, cy, layer) && this.obstacleHeight(cx, cy) > clearance;
  }

  obstacleHeight(cx: number, cy: number): number {
    return TILE_TRAITS[this.kindAt(cx, cy)].height;
  }

  isBlockedAtIndex(index: number, layer: CollisionLayer): boolean {
    if (this.clearedCells[index] === 1) {
      return false;
    }
    const kind = (this.tiles[index] ?? TileKind.Wall) as TileKind;
    return TILE_TRAITS[kind].blocks[layer];
  }
}
