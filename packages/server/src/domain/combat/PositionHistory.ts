import { RingBuffer } from '@graveshift/shared/core';
import type { Vec2 } from '@graveshift/shared/core';
import type { Body } from '../entities/Body.ts';
import type { HistoryFrame } from './HistoryFrame.ts';

const COMPONENTS_PER_ENTRY = 2;

export class PositionHistory {
  private readonly frames: RingBuffer<HistoryFrame>;

  constructor(capacityTicks: number) {
    this.frames = new RingBuffer<HistoryFrame>(capacityTicks);
  }

  record(tick: number, groups: readonly Iterable<Body>[]): void {
    const offsets = new Map<Body, number>();
    const coordinates: number[] = [];
    for (const group of groups) {
      for (const body of group) {
        offsets.set(body, coordinates.length);
        coordinates.push(body.position.x, body.position.y);
      }
    }
    this.frames.push({ tick, offsets, coordinates: Float32Array.from(coordinates) });
  }

  resolve(body: Body, tick: number, target: Vec2): Vec2 {
    const frame = this.frameAt(tick);
    const offset = frame === undefined ? undefined : frame.offsets.get(body);
    if (frame === undefined || offset === undefined) {
      target.x = body.position.x;
      target.y = body.position.y;
      return target;
    }
    target.x = frame.coordinates[offset] ?? body.position.x;
    target.y = frame.coordinates[offset + COMPONENTS_PER_ENTRY - 1] ?? body.position.y;
    return target;
  }

  private frameAt(tick: number): HistoryFrame | undefined {
    const newest = this.frames.newest();
    if (newest === undefined) {
      return undefined;
    }
    const offsetFromNewest = newest.tick - tick;
    return this.frames.at(this.frames.size - 1 - offsetFromNewest);
  }
}
