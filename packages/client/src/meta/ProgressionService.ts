import { combineUnsubscribes } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { ClientEventType } from '../game/events/ClientEvent.ts';
import { ClientEventBus } from '../game/events/ClientEventBus.ts';
import { ACHIEVEMENTS } from './achievements/achievementCatalog.ts';
import { AchievementTracker } from './achievements/AchievementTracker.ts';
import { createCounterRules } from './counters/counterRules.ts';
import { CounterStore } from './counters/CounterStore.ts';
import { LocalPlayerContext } from './counters/LocalPlayerContext.ts';
import type { KeyValueStore } from './storage/KeyValueStore.ts';
import { isOfficialLevel } from './isOfficialLevel.ts';

export class ProgressionService {
  readonly counters: CounterStore;
  readonly achievements: AchievementTracker;
  private readonly local: LocalPlayerContext;
  private readonly detachRules: Unsubscribe;
  private readonly detachSource: Unsubscribe;

  constructor(bus: ClientEventBus, storage: KeyValueStore, now: () => number) {
    this.counters = new CounterStore(storage);
    const progressEvents = new ClientEventBus();
    this.local = new LocalPlayerContext(progressEvents);
    this.achievements = new AchievementTracker(ACHIEVEMENTS, this.counters, storage, bus, Date.now);
    const context = { bus: progressEvents, counters: this.counters, local: this.local, now };
    this.detachRules = combineUnsubscribes(
      createCounterRules().map((rule) => rule.attach(context)),
    );
    let active = false;
    this.detachSource = bus.onAny((event) => {
      if (event.type === ClientEventType.MatchStarted) {
        if (active) {
          progressEvents.emit({ type: ClientEventType.MatchLeft });
        }
        active = isOfficialLevel(event.level);
      }
      if (active && event.type !== ClientEventType.AchievementUnlocked) {
        progressEvents.emit(event);
      }
      if (
        event.type === ClientEventType.MatchFinished ||
        event.type === ClientEventType.MatchLeft
      ) {
        active = false;
      }
    });
  }

  resetProgress(): void {
    this.counters.reset();
    this.achievements.reset();
  }

  dispose(): void {
    this.detachSource();
    this.detachRules();
    this.achievements.dispose();
    this.counters.dispose();
    this.local.dispose();
  }
}
