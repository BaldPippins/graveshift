import type { ReadonlyVec2, Vec2 } from '../core/Vec2.ts';
import type { CellCoord } from './CellCoord.ts';

const CELL_CENTER_OFFSET = 0.5;

export function cellCenter(cell: CellCoord): Vec2 {
  return { x: cell.cx + CELL_CENTER_OFFSET, y: cell.cy + CELL_CENTER_OFFSET };
}

export function cellAt(point: ReadonlyVec2): CellCoord {
  return { cx: Math.floor(point.x), cy: Math.floor(point.y) };
}
