export class IdPool {
  private readonly released: number[] = [];
  private nextFresh: number;
  private readonly maxId: number;

  constructor(firstId: number, maxId: number) {
    this.nextFresh = firstId;
    this.maxId = maxId;
  }

  acquire(): number {
    const recycled = this.released.shift();
    if (recycled !== undefined) {
      return recycled;
    }
    if (this.nextFresh > this.maxId) {
      throw new RangeError('IdPool exhausted');
    }
    const id = this.nextFresh;
    this.nextFresh += 1;
    return id;
  }

  release(id: number): void {
    this.released.push(id);
  }
}
