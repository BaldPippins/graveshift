import { combineUnsubscribes } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { ClientEventType } from '../../../game/events/ClientEvent.ts';
import { CounterId } from '../CounterId.ts';
import type { CounterRule, CounterRuleContext } from './CounterRule.ts';

const MILLISECONDS_PER_SECOND = 1000;

export class PlayTimeRule implements CounterRule {
  private startedAt: number | null = null;

  attach(context: CounterRuleContext): Unsubscribe {
    const stop = (): void => {
      if (this.startedAt === null) {
        return;
      }
      context.counters.add(
        CounterId.SecondsPlayed,
        (context.now() - this.startedAt) / MILLISECONDS_PER_SECOND,
      );
      this.startedAt = null;
    };
    return combineUnsubscribes([
      context.bus.on(ClientEventType.MatchStarted, () => {
        stop();
        this.startedAt = context.now();
      }),
      context.bus.on(ClientEventType.MatchFinished, stop),
      context.bus.on(ClientEventType.MatchLeft, stop),
    ]);
  }
}
