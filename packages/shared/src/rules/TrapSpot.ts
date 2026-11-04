import type { TrapKind } from '../config/traps.ts';
import type { ReadonlyVec2 } from '../core/Vec2.ts';
import type { CellCoord } from '../world/CellCoord.ts';

export interface TrapSpot {
  readonly kind: TrapKind;
  readonly cell: CellCoord;
  readonly index: number;
  readonly center: ReadonlyVec2;
}
