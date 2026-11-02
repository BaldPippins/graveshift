import type { ReadonlyVec2 } from '@graveshift/shared/core';

export class SpatialHashGrid<T> {
  private readonly cellSize: number;
  private readonly buckets = new Map<number, T[]>();
  private readonly activeKeys: number[] = [];

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  clear(): void {
    for (const key of this.activeKeys) {
      const bucket = this.buckets.get(key);
      if (bucket !== undefined) {
        bucket.length = 0;
      }
    }
    this.activeKeys.length = 0;
  }

  insert(item: T, position: ReadonlyVec2): void {
    const key = this.keyOf(
      Math.floor(position.x / this.cellSize),
      Math.floor(position.y / this.cellSize),
    );
    let bucket = this.buckets.get(key);
    if (bucket === undefined) {
      bucket = [];
      this.buckets.set(key, bucket);
    }
    if (bucket.length === 0) {
      this.activeKeys.push(key);
    }
    bucket.push(item);
  }

  forEachNear(position: ReadonlyVec2, radius: number, visit: (item: T) => void): void {
    const minX = Math.floor((position.x - radius) / this.cellSize);
    const maxX = Math.floor((position.x + radius) / this.cellSize);
    const minY = Math.floor((position.y - radius) / this.cellSize);
    const maxY = Math.floor((position.y + radius) / this.cellSize);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const bucket = this.buckets.get(this.keyOf(x, y));
        if (bucket !== undefined) {
          for (const item of bucket) {
            visit(item);
          }
        }
      }
    }
  }

  private keyOf(x: number, y: number): number {
    return (x + 0x8000) * 0x10000 + (y + 0x8000);
  }
}
