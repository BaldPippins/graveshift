import type { GameEvent } from '@graveshift/shared/protocol';

export interface TimedEvent {
  readonly tick: number;
  readonly event: GameEvent;
}
