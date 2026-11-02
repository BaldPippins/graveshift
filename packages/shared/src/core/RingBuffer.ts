export class RingBuffer<T> {
  readonly capacity: number;
  private readonly items: (T | undefined)[];
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError(`RingBuffer capacity must be a positive integer, got ${capacity}`);
    }
    this.capacity = capacity;
    this.items = new Array<T | undefined>(capacity);
  }

  get size(): number {
    return this.count;
  }

  push(item: T): void {
    const index = (this.head + this.count) % this.capacity;
    this.items[index] = item;
    if (this.count < this.capacity) {
      this.count += 1;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  at(offsetFromOldest: number): T | undefined {
    if (offsetFromOldest < 0 || offsetFromOldest >= this.count) {
      return undefined;
    }
    return this.items[(this.head + offsetFromOldest) % this.capacity];
  }

  newest(): T | undefined {
    return this.at(this.count - 1);
  }

  oldest(): T | undefined {
    return this.at(0);
  }

  clear(): void {
    this.items.fill(undefined);
    this.head = 0;
    this.count = 0;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    for (let offset = 0; offset < this.count; offset += 1) {
      const item = this.at(offset);
      if (item !== undefined) {
        yield item;
      }
    }
  }
}
