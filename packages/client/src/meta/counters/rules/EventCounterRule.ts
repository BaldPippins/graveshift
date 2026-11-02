import type { EventOfType, Unsubscribe } from '@graveshift/shared/core';
import type { ClientEvent } from '../../../game/events/ClientEvent.ts';
import type { CounterId } from '../CounterId.ts';
import type { LocalPlayerContext } from '../LocalPlayerContext.ts';
import { CounterOperation } from './CounterOperation.ts';
import type { CounterRule, CounterRuleContext } from './CounterRule.ts';

export type EventAmount<TType extends ClientEvent['type']> = (
  event: EventOfType<ClientEvent, TType>,
  local: LocalPlayerContext,
) => number;

export class EventCounterRule<TType extends ClientEvent['type']> implements CounterRule {
  private readonly eventType: TType;
  private readonly counter: CounterId;
  private readonly amountOf: EventAmount<TType>;
  private readonly operation: CounterOperation;

  constructor(
    eventType: TType,
    counter: CounterId,
    amountOf: EventAmount<TType>,
    operation: CounterOperation = CounterOperation.Add,
  ) {
    this.eventType = eventType;
    this.counter = counter;
    this.amountOf = amountOf;
    this.operation = operation;
  }

  attach(context: CounterRuleContext): Unsubscribe {
    return context.bus.on(this.eventType, (event) => {
      const amount = this.amountOf(event, context.local);
      if (this.operation === CounterOperation.Raise) {
        context.counters.raise(this.counter, amount);
      } else {
        context.counters.add(this.counter, amount);
      }
    });
  }
}
