import type { WeightedOption } from './WeightedOption.ts';

const UINT32_RANGE = 0x1_0000_0000;

export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let mixed = this.state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  integer(minInclusive: number, maxExclusive: number): number {
    return Math.floor(this.range(minInclusive, maxExclusive));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    const item = items[this.integer(0, items.length)];
    if (item === undefined) {
      throw new RangeError('Cannot pick from an empty list');
    }
    return item;
  }

  pickWeighted<T>(options: readonly WeightedOption<T>[]): T {
    const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
    let roll = this.next() * totalWeight;
    for (const option of options) {
      roll -= option.weight;
      if (roll < 0) {
        return option.value;
      }
    }
    const last = options.at(-1);
    if (last === undefined) {
      throw new RangeError('Cannot pick from an empty list');
    }
    return last.value;
  }
}
