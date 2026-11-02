import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { CounterId } from '../CounterId.ts';
import type { CounterRule, CounterRuleContext } from './CounterRule.ts';

export class MultiKillRule implements CounterRule {
  private readonly windowMilliseconds: number;
  private readonly killTimes: number[] = [];

  constructor(windowMilliseconds: number) {
    this.windowMilliseconds = windowMilliseconds;
  }

  attach(context: CounterRuleContext): Unsubscribe {
    return context.bus.on(GameEventType.EnemyKilled, (event) => {
      if (!context.local.isLocal(event.killerId)) {
        return;
      }
      const now = context.now();
      this.killTimes.push(now);
      while ((this.killTimes[0] ?? now) < now - this.windowMilliseconds) {
        this.killTimes.shift();
      }
      context.counters.raise(CounterId.BestMultikill, this.killTimes.length);
    });
  }
}
