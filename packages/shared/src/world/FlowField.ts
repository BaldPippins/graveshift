import { BinaryMinHeap } from '../core/BinaryMinHeap.ts';
import { directionTo } from '../core/vectorMath.ts';
import type { ReadonlyVec2, Vec2 } from '../core/Vec2.ts';
import type { CellCoord } from './CellCoord.ts';
import { cellAt, cellCenter } from './cellMath.ts';
import { CollisionLayer } from './CollisionLayer.ts';
import type { TileMap } from './TileMap.ts';

const UNREACHABLE = -1;
const MIN_STEP = 1e-6;
const DIAGONAL_COST = Math.SQRT2;
const NEIGHBOR_OFFSETS: readonly (readonly [number, number, number])[] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, DIAGONAL_COST],
  [1, -1, DIAGONAL_COST],
  [-1, 1, DIAGONAL_COST],
  [-1, -1, DIAGONAL_COST],
];

export class FlowField {
  private readonly map: TileMap;
  private readonly distances: Float64Array;
  private readonly nextCell: Int32Array;
  private readonly heap = new BinaryMinHeap();

  constructor(map: TileMap) {
    this.map = map;
    this.distances = new Float64Array(map.cellCount);
    this.nextCell = new Int32Array(map.cellCount);
  }

  rebuild(sources: readonly CellCoord[]): void {
    this.distances.fill(Number.POSITIVE_INFINITY);
    this.nextCell.fill(UNREACHABLE);
    this.heap.clear();
    for (const source of sources) {
      if (!this.map.isInside(source.cx, source.cy)) {
        continue;
      }
      const index = this.map.indexOf(source.cx, source.cy);
      this.distances[index] = 0;
      this.nextCell[index] = index;
      this.heap.push(index, 0);
    }
    while (this.heap.size > 0) {
      const distance = this.heap.peekPriority();
      const current = this.heap.pop();
      if (distance > (this.distances[current] ?? 0)) {
        continue;
      }
      this.relaxNeighbors(current, distance);
    }
  }

  distanceAt(cx: number, cy: number): number {
    if (!this.map.isInside(cx, cy)) {
      return Number.POSITIVE_INFINITY;
    }
    return this.distances[this.map.indexOf(cx, cy)] ?? Number.POSITIVE_INFINITY;
  }

  directionAt(position: ReadonlyVec2, target: Vec2): boolean {
    const { cx, cy } = cellAt(position);
    if (!this.map.isInside(cx, cy)) {
      return false;
    }
    const next = this.nextCell[this.map.indexOf(cx, cy)] ?? UNREACHABLE;
    if (next === UNREACHABLE) {
      return false;
    }
    return directionTo(position, cellCenter(this.map.cellOfIndex(next)), target) > MIN_STEP;
  }

  private relaxNeighbors(current: number, distance: number): void {
    const { cx, cy } = this.map.cellOfIndex(current);
    for (const [dx, dy, cost] of NEIGHBOR_OFFSETS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!this.isPassable(nx, ny) || this.cutsCorner(cx, cy, dx, dy)) {
        continue;
      }
      const neighbor = this.map.indexOf(nx, ny);
      const candidate = distance + cost;
      if (candidate < (this.distances[neighbor] ?? Number.POSITIVE_INFINITY)) {
        this.distances[neighbor] = candidate;
        this.nextCell[neighbor] = current;
        this.heap.push(neighbor, candidate);
      }
    }
  }

  private isPassable(cx: number, cy: number): boolean {
    return this.map.isInside(cx, cy) && !this.map.isBlocked(cx, cy, CollisionLayer.Movement);
  }

  private cutsCorner(cx: number, cy: number, dx: number, dy: number): boolean {
    if (dx === 0 || dy === 0) {
      return false;
    }
    return !this.isPassable(cx + dx, cy) || !this.isPassable(cx, cy + dy);
  }
}
