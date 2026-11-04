import type { TileMap } from '../world/TileMap.ts';

export class Wreckage {
  private readonly map: TileMap;
  private readonly wrecked = new Set<number>();

  constructor(map: TileMap) {
    this.map = map;
  }

  setWrecked(index: number, wrecked: boolean): void {
    if (wrecked) {
      this.wrecked.add(index);
    } else {
      this.wrecked.delete(index);
    }
    this.map.setIndexCleared(index, wrecked);
  }

  syncWrecked(indices: ReadonlySet<number>): void {
    for (const index of [...this.wrecked]) {
      if (!indices.has(index)) {
        this.setWrecked(index, false);
      }
    }
    for (const index of indices) {
      if (!this.wrecked.has(index)) {
        this.setWrecked(index, true);
      }
    }
  }
}
