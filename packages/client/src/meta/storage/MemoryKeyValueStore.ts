import type { Unsubscribe } from '@graveshift/shared/core';
import type { KeyValueStore } from './KeyValueStore.ts';

export class MemoryKeyValueStore implements KeyValueStore {
  private readonly values = new Map<string, unknown>();

  read(key: string): unknown {
    return this.values.get(key);
  }

  write(key: string, value: unknown): void {
    this.values.set(key, structuredClone(value));
  }

  watch(): Unsubscribe {
    return () => undefined;
  }

  remove(key: string): void {
    this.values.delete(key);
  }
}
