import { combineUnsubscribes } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { ClientEventType } from '../../../game/events/ClientEvent.ts';
import { CounterId } from '../CounterId.ts';
import type { CounterRule, CounterRuleContext } from './CounterRule.ts';

export class FlawlessWaveRule implements CounterRule {
  private damagedThisWave = false;

  attach(context: CounterRuleContext): Unsubscribe {
    return combineUnsubscribes([
      context.bus.on(ClientEventType.MatchStarted, (event) => {
        if (event.resumed === true) {
          this.damagedThisWave = true;
        }
      }),
      context.bus.on(GameEventType.WaveStarted, () => {
        this.damagedThisWave = false;
      }),
      context.bus.on(GameEventType.PlayerDamaged, (event) => {
        if (context.local.isLocal(event.playerId)) {
          this.damagedThisWave = true;
        }
      }),
      context.bus.on(GameEventType.WaveCleared, () => {
        if (!this.damagedThisWave) {
          context.counters.add(CounterId.FlawlessWaves, 1);
        }
      }),
    ]);
  }
}
