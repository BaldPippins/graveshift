import type { Unsubscribe } from '@graveshift/shared/core';
import { ClientEventType } from '../../game/events/ClientEvent.ts';
import type { ClientEventBus } from '../../game/events/ClientEventBus.ts';

export class LocalPlayerContext {
  private playerId: number | null = null;
  private readonly unsubscribe: Unsubscribe;

  constructor(bus: ClientEventBus) {
    this.unsubscribe = bus.on(ClientEventType.MatchStarted, (event) => {
      this.playerId = event.localPlayerId;
    });
  }

  isLocal(playerId: number): boolean {
    return this.playerId !== null && this.playerId === playerId;
  }

  dispose(): void {
    this.unsubscribe();
  }
}
