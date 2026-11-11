import { STARTING_WEAPONS } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import { combineUnsubscribes } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { ClientEventType } from '../../../game/events/ClientEvent.ts';
import type { CounterId } from '../CounterId.ts';
import type { CounterRule, CounterRuleContext } from './CounterRule.ts';

export class ArsenalRule implements CounterRule {
  private readonly collection: readonly WeaponId[];
  private readonly counter: CounterId;
  private readonly owned = new Set<WeaponId>();

  constructor(collection: readonly WeaponId[], counter: CounterId) {
    this.collection = collection;
    this.counter = counter;
    this.reset();
  }

  attach(context: CounterRuleContext): Unsubscribe {
    return combineUnsubscribes([
      context.bus.on(ClientEventType.MatchStarted, (event) => {
        if (event.resumed !== true) {
          this.reset();
        }
      }),
      context.bus.on(ClientEventType.LoadoutUpdated, (event) => {
        this.owned.clear();
        for (const weapon of event.ownedWeapons) {
          if (this.collection.includes(weapon)) {
            this.owned.add(weapon);
          }
        }
        if (this.owned.size === this.collection.length) {
          context.counters.raise(this.counter, 1);
        }
      }),
      context.bus.on(GameEventType.WeaponUnlocked, (event) => {
        if (!context.local.isLocal(event.playerId) || !this.collection.includes(event.weapon)) {
          return;
        }
        this.owned.add(event.weapon);
        if (this.owned.size === this.collection.length) {
          context.counters.raise(this.counter, 1);
        }
      }),
    ]);
  }

  private reset(): void {
    this.owned.clear();
    for (const weapon of STARTING_WEAPONS) {
      if (this.collection.includes(weapon)) {
        this.owned.add(weapon);
      }
    }
  }
}
