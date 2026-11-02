export class BinaryMinHeap {
  private values = new Int32Array(64);
  private priorities = new Float64Array(64);
  private count = 0;

  get size(): number {
    return this.count;
  }

  clear(): void {
    this.count = 0;
  }

  push(value: number, priority: number): void {
    if (this.count === this.values.length) {
      this.grow();
    }
    let index = this.count;
    this.count += 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      const parentPriority = this.priorities[parent] ?? 0;
      if (parentPriority <= priority) {
        break;
      }
      this.values[index] = this.values[parent] ?? 0;
      this.priorities[index] = parentPriority;
      index = parent;
    }
    this.values[index] = value;
    this.priorities[index] = priority;
  }

  peekPriority(): number {
    return this.priorities[0] ?? Number.POSITIVE_INFINITY;
  }

  pop(): number {
    if (this.count === 0) {
      throw new RangeError('Heap is empty');
    }
    const top = this.values[0] ?? 0;
    this.count -= 1;
    const lastValue = this.values[this.count] ?? 0;
    const lastPriority = this.priorities[this.count] ?? 0;
    let index = 0;
    for (;;) {
      const left = index * 2 + 1;
      if (left >= this.count) {
        break;
      }
      const right = left + 1;
      const smaller =
        right < this.count && (this.priorities[right] ?? 0) < (this.priorities[left] ?? 0)
          ? right
          : left;
      if ((this.priorities[smaller] ?? 0) >= lastPriority) {
        break;
      }
      this.values[index] = this.values[smaller] ?? 0;
      this.priorities[index] = this.priorities[smaller] ?? 0;
      index = smaller;
    }
    this.values[index] = lastValue;
    this.priorities[index] = lastPriority;
    return top;
  }

  private grow(): void {
    const values = new Int32Array(this.values.length * 2);
    const priorities = new Float64Array(this.priorities.length * 2);
    values.set(this.values);
    priorities.set(this.priorities);
    this.values = values;
    this.priorities = priorities;
  }
}
