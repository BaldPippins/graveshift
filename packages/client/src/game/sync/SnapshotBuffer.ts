import { clamp, RingBuffer } from '@graveshift/shared/core';
import type { SnapshotMessage } from '@graveshift/shared/protocol';
import type { SnapshotBracket } from './SnapshotBracket.ts';

const CAPACITY = 32;

export class SnapshotBuffer {
  private readonly snapshots = new RingBuffer<SnapshotMessage>(CAPACITY);

  get latest(): SnapshotMessage | undefined {
    return this.snapshots.newest();
  }

  push(snapshot: SnapshotMessage): void {
    const newest = this.snapshots.newest();
    if (newest !== undefined && snapshot.tick <= newest.tick) {
      return;
    }
    this.snapshots.push(snapshot);
  }

  bracket(renderTick: number): SnapshotBracket | undefined {
    const newest = this.snapshots.newest();
    const oldest = this.snapshots.oldest();
    if (newest === undefined || oldest === undefined) {
      return undefined;
    }
    if (renderTick >= newest.tick) {
      return { older: newest, newer: newest, alpha: 1 };
    }
    if (renderTick <= oldest.tick) {
      return { older: oldest, newer: oldest, alpha: 0 };
    }
    for (let index = this.snapshots.size - 1; index > 0; index -= 1) {
      const newer = this.snapshots.at(index);
      const older = this.snapshots.at(index - 1);
      if (newer !== undefined && older !== undefined && older.tick <= renderTick) {
        const alpha = clamp((renderTick - older.tick) / (newer.tick - older.tick), 0, 1);
        return { older, newer, alpha };
      }
    }
    return { older: oldest, newer: oldest, alpha: 0 };
  }
}
