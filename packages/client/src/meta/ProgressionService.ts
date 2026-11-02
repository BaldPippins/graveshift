import { combineUnsubscribes } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import type { ClientEventBus } from '../game/events/ClientEventBus.ts';
import { ACHIEVEMENTS } from './achievements/achievementCatalog.ts';
import { AchievementTracker } from './achievements/AchievementTracker.ts';
import { createCounterRules } from './counters/counterRules.ts';
import { CounterStore } from './counters/CounterStore.ts';
import { LocalPlayerContext } from './counters/LocalPlayerContext.ts';
import type { KeyValueStore } from './storage/KeyValueStore.ts';

export class ProgressionService {
  readonly counters: CounterStore;
  readonly achievements: AchievementTracker;
  private readonly local: LocalPlayerContext;
  private readonly detachRules: Unsubscribe;

  constructor(bus: ClientEventBus, storage: KeyValueStore, now: () => number) {
    this.counters = new CounterStore(storage);
    this.local = new LocalPlayerContext(bus);
    this.achievements = new AchievementTracker(ACHIEVEMENTS, this.counters, storage, bus, Date.now);
    const context = { bus, counters: this.counters, local: this.local, now };
    this.detachRules = combineUnsubscribes(
      createCounterRules().map((rule) => rule.attach(context)),
    );
  }

  resetProgress(): void {
    this.counters.reset();
    this.achievements.reset();
  }

  dispose(): void {
    this.detachRules();
    this.achievements.dispose();
    this.counters.dispose();
    this.local.dispose();
  }
}
