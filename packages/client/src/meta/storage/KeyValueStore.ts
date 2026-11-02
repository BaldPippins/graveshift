import type { Unsubscribe } from '@graveshift/shared/core';

export interface KeyValueStore {
  read(key: string): unknown;
  write(key: string, value: unknown): void;
  remove(key: string): void;
  watch(key: string, onExternalChange: () => void): Unsubscribe;
}
