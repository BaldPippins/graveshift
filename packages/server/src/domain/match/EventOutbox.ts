import type { Unsubscribe } from '@graveshift/shared/core';
import type { GameEvent } from '@graveshift/shared/protocol';
import type { MatchEventBus } from './MatchEventBus.ts';

export class EventOutbox {
  private pending: GameEvent[] = [];
  private readonly unsubscribe: Unsubscribe;

  constructor(events: MatchEventBus) {
    this.unsubscribe = events.onAny((event) => {
      this.pending.push(event);
    });
  }

  drain(): GameEvent[] {
    const drained = this.pending;
    this.pending = [];
    return drained;
  }

  dispose(): void {
    this.unsubscribe();
  }
}
