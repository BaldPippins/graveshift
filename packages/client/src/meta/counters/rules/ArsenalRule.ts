import { STARTING_WEAPON, WEAPON_IDS } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import { combineUnsubscribes } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { ClientEventType } from '../../../game/events/ClientEvent.ts';
import { CounterId } from '../CounterId.ts';
import type { CounterRule, CounterRuleContext } from './CounterRule.ts';

export class ArsenalRule implements CounterRule {
  private readonly owned = new Set<WeaponId>([STARTING_WEAPON]);

  attach(context: CounterRuleContext): Unsubscribe {
    return combineUnsubscribes([
      context.bus.on(ClientEventType.MatchStarted, () => {
        this.owned.clear();
        this.owned.add(STARTING_WEAPON);
      }),
      context.bus.on(GameEventType.WeaponUnlocked, (event) => {
        if (!context.local.isLocal(event.playerId)) {
          return;
        }
        this.owned.add(event.weapon);
        if (this.owned.size === WEAPON_IDS.length) {
          context.counters.raise(CounterId.ArsenalComplete, 1);
        }
      }),
    ]);
  }
}
