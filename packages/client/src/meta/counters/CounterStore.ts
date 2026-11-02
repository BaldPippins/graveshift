import { signal } from '@preact/signals-core';
import type { ReadonlySignal } from '@preact/signals-core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { numberRecord } from '../storage/guards.ts';
import type { KeyValueStore } from '../storage/KeyValueStore.ts';
import { COUNTER_IDS } from './CounterId.ts';
import type { CounterId } from './CounterId.ts';

const STORAGE_KEY = 'graveshift.counters.v1';

export type CounterValues = Readonly<Record<CounterId, number>>;
export type CounterListener = (counter: CounterId, value: number) => void;

function parseCounters(raw: unknown): CounterValues {
  const stored = numberRecord(raw);
  return Object.fromEntries(COUNTER_IDS.map((id) => [id, stored[id] ?? 0])) as Record<
    CounterId,
    number
  >;
}

export class CounterStore {
  private readonly storage: KeyValueStore;
  private readonly state;
  private readonly listeners = new Set<CounterListener>();
  private readonly unwatch: Unsubscribe;

  constructor(storage: KeyValueStore) {
    this.storage = storage;
    this.state = signal<CounterValues>(this.load());
    this.unwatch = storage.watch(STORAGE_KEY, () => {
      this.state.value = this.load();
    });
  }

  get values(): ReadonlySignal<CounterValues> {
    return this.state;
  }

  valueOf(counter: CounterId): number {
    return this.state.value[counter];
  }

  add(counter: CounterId, amount: number): void {
    if (amount === 0) {
      return;
    }
    const stored = this.load();
    this.commit(stored, counter, stored[counter] + amount);
  }

  raise(counter: CounterId, candidate: number): void {
    const stored = this.load();
    if (candidate > stored[counter]) {
      this.commit(stored, counter, candidate);
    }
  }

  onChange(listener: CounterListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.state.value = parseCounters(undefined);
    this.storage.remove(STORAGE_KEY);
  }

  dispose(): void {
    this.unwatch();
    this.listeners.clear();
  }

  private load(): CounterValues {
    return parseCounters(this.storage.read(STORAGE_KEY));
  }

  private commit(stored: CounterValues, counter: CounterId, value: number): void {
    this.state.value = { ...stored, [counter]: value };
    this.storage.write(STORAGE_KEY, this.state.value);
    for (const listener of this.listeners) {
      listener(counter, value);
    }
  }
}
