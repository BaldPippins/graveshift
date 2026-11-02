import type { Unsubscribe } from '@graveshift/shared/core';
import type { ClientEventBus } from '../../../game/events/ClientEventBus.ts';
import type { CounterStore } from '../CounterStore.ts';
import type { LocalPlayerContext } from '../LocalPlayerContext.ts';

export interface CounterRuleContext {
  readonly bus: ClientEventBus;
  readonly counters: CounterStore;
  readonly local: LocalPlayerContext;
  readonly now: () => number;
}

export interface CounterRule {
  attach(context: CounterRuleContext): Unsubscribe;
}
