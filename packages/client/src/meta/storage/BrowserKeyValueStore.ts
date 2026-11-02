import type { Unsubscribe } from '@graveshift/shared/core';
import type { KeyValueStore } from './KeyValueStore.ts';

function tryStorage<T>(operation: (storage: Storage) => T): T | undefined {
  try {
    return operation(window.localStorage);
  } catch {
    return undefined;
  }
}

export class BrowserKeyValueStore implements KeyValueStore {
  private readonly memory = new Map<string, string>();

  read(key: string): unknown {
    const raw = tryStorage((storage) => storage.getItem(key)) ?? this.memory.get(key);
    if (raw === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }

  write(key: string, value: unknown): void {
    const raw = JSON.stringify(value);
    this.memory.set(key, raw);
    tryStorage((storage) => {
      storage.setItem(key, raw);
    });
  }

  watch(key: string, onExternalChange: () => void): Unsubscribe {
    const listener = (event: StorageEvent): void => {
      if (event.key === key || event.key === null) {
        this.memory.delete(key);
        onExternalChange();
      }
    };
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener('storage', listener);
    };
  }

  remove(key: string): void {
    this.memory.delete(key);
    tryStorage((storage) => {
      storage.removeItem(key);
    });
  }
}
