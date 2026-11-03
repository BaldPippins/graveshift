import type { CellCoord } from '../world/CellCoord.ts';
import { TileKind } from '../world/TileKind.ts';
import type { TileMap } from '../world/TileMap.ts';

export class MerchantStall {
  private readonly map: TileMap;
  private readonly cells: readonly CellCoord[];
  private merchantPresent = true;

  constructor(map: TileMap) {
    this.map = map;
    this.cells = map.cellsOfKind(TileKind.Merchant);
  }

  setMerchantPresent(present: boolean): void {
    if (present === this.merchantPresent) {
      return;
    }
    this.merchantPresent = present;
    for (const cell of this.cells) {
      this.map.setCellCleared(cell, !present);
    }
  }
}
