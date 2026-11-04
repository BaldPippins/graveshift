import { describe, expect, it } from 'vitest';
import { BinaryMinHeap } from './BinaryMinHeap.ts';
import { flagSetOf, hasFlag, isFlagSetOf } from './FlagSet.ts';
import { RingBuffer } from './RingBuffer.ts';
import { lerpAngle, wrapAngle } from './scalarMath.ts';
import { SeededRandom } from './SeededRandom.ts';
import { TypedEventBus } from './TypedEventBus.ts';

interface PingEvent {
  readonly type: 'ping';
  readonly value: number;
}

interface PongEvent {
  readonly type: 'pong';
}

describe('core', () => {
  it('ring buffer keeps the newest items', () => {
    const buffer = new RingBuffer<number>(3);
    [1, 2, 3, 4, 5].forEach((value) => {
      buffer.push(value);
    });
    expect([...buffer]).toEqual([3, 4, 5]);
    expect(buffer.newest()).toBe(5);
    expect(buffer.oldest()).toBe(3);
  });

  it('min heap pops in priority order', () => {
    const heap = new BinaryMinHeap();
    const priorities = [5, 1, 9, 3, 7, 2, 8, 0, 6, 4];
    priorities.forEach((priority) => {
      heap.push(priority * 10, priority);
    });
    const popped = Array.from({ length: priorities.length }, () => heap.pop());
    expect(popped).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  });

  it('seeded random is deterministic', () => {
    const first = new SeededRandom(7);
    const second = new SeededRandom(7);
    const sequence = Array.from({ length: 5 }, () => first.next());
    expect(Array.from({ length: 5 }, () => second.next())).toEqual(sequence);
    expect(sequence.every((value) => value >= 0 && value < 1)).toBe(true);
  });

  it('angles wrap through the short arc', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(-Math.PI);
    expect(lerpAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.5)).toBeCloseTo(Math.PI, 5);
  });

  it('event bus routes by type and supports unsubscribe', () => {
    const bus = new TypedEventBus<PingEvent | PongEvent>();
    const received: number[] = [];
    const unsubscribe = bus.on('ping', (event) => received.push(event.value));
    let anyCount = 0;
    bus.onAny(() => {
      anyCount += 1;
    });
    bus.emit({ type: 'ping', value: 1 });
    bus.emit({ type: 'pong' });
    unsubscribe();
    bus.emit({ type: 'ping', value: 2 });
    expect(received).toEqual([1]);
    expect(anyCount).toBe(3);
  });
});

describe('FlagSet', () => {
  const Flag = { A: 1, B: 2, C: 4 } as const;
  const FLAGS = [Flag.A, Flag.B, Flag.C];

  it('combines and reads typed flags', () => {
    const set = flagSetOf([Flag.A, Flag.C]);
    expect(hasFlag(set, Flag.A)).toBe(true);
    expect(hasFlag(set, Flag.B)).toBe(false);
    expect(hasFlag(set, Flag.C)).toBe(true);
  });

  it('accepts only masks made of known flags', () => {
    expect(isFlagSetOf(5, FLAGS)).toBe(true);
    expect(isFlagSetOf(8, FLAGS)).toBe(false);
    expect(isFlagSetOf(-1, FLAGS)).toBe(false);
  });
});
