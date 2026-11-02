import { signal } from '@preact/signals-core';
import type { ReadonlySignal } from '@preact/signals-core';
import { ClientEventType } from '../../game/events/ClientEvent.ts';
import type { ClientEventBus } from '../../game/events/ClientEventBus.ts';
import type { CounterId } from '../counters/CounterId.ts';
import type { CounterStore } from '../counters/CounterStore.ts';
import { numberRecord } from '../storage/guards.ts';
import type { KeyValueStore } from '../storage/KeyValueStore.ts';
import type { AchievementDefinition } from './AchievementDefinition.ts';

const STORAGE_KEY = 'graveshift.achievements.v1';

export type UnlockedAchievements = Readonly<Record<string, number>>;

export class AchievementTracker {
  private readonly definitionsByCounter = new Map<CounterId, AchievementDefinition[]>();
  private readonly counters: CounterStore;
  private readonly storage: KeyValueStore;
  private readonly bus: ClientEventBus;
  private readonly now: () => number;
  private readonly state;
  private readonly unsubscribe: () => void;
  private readonly unwatch: () => void;

  constructor(
    definitions: readonly AchievementDefinition[],
    counters: CounterStore,
    storage: KeyValueStore,
    bus: ClientEventBus,
    now: () => number,
  ) {
    this.counters = counters;
    this.storage = storage;
    this.bus = bus;
    this.now = now;
    this.state = signal<UnlockedAchievements>(this.load());
    this.unwatch = storage.watch(STORAGE_KEY, () => {
      this.state.value = this.load();
    });
    for (const definition of definitions) {
      const list = this.definitionsByCounter.get(definition.counter) ?? [];
      list.push(definition);
      this.definitionsByCounter.set(definition.counter, list);
    }
    this.unsubscribe = counters.onChange((counter, value) => {
      this.evaluate(counter, value);
    });
    for (const counter of this.definitionsByCounter.keys()) {
      this.evaluate(counter, counters.valueOf(counter));
    }
  }

  get unlocked(): ReadonlySignal<UnlockedAchievements> {
    return this.state;
  }

  progressOf(definition: AchievementDefinition): number {
    return Math.min(1, this.counters.valueOf(definition.counter) / definition.target);
  }

  reset(): void {
    this.state.value = {};
    this.storage.remove(STORAGE_KEY);
  }

  dispose(): void {
    this.unsubscribe();
    this.unwatch();
  }

  private load(): UnlockedAchievements {
    return numberRecord(this.storage.read(STORAGE_KEY));
  }

  private evaluate(counter: CounterId, value: number): void {
    for (const definition of this.definitionsByCounter.get(counter) ?? []) {
      if (value >= definition.target && this.state.value[definition.id] === undefined) {
        this.unlock(definition);
      }
    }
  }

  private unlock(definition: AchievementDefinition): void {
    const stored = this.load();
    if (stored[definition.id] !== undefined) {
      this.state.value = stored;
      return;
    }
    this.state.value = { ...stored, [definition.id]: this.now() };
    this.storage.write(STORAGE_KEY, this.state.value);
    this.bus.emit({ type: ClientEventType.AchievementUnlocked, achievementId: definition.id });
  }
}
