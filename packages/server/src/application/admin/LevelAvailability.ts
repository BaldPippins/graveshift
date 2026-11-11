import type { LevelDefinition } from '@graveshift/shared/world';

export interface LevelAvailabilityStore {
  disabledLevels(): string[];
  setLevelEnabled(id: string, enabled: boolean, knownIds: readonly string[]): boolean;
}

export interface AdminLevel {
  readonly id: string;
  readonly enabled: boolean;
}

export class LevelAvailability {
  private readonly available = new Map<string, LevelDefinition>();
  private readonly all: ReadonlyMap<string, LevelDefinition>;
  private readonly store: LevelAvailabilityStore;

  constructor(all: ReadonlyMap<string, LevelDefinition>, store: LevelAvailabilityStore) {
    this.all = all;
    this.store = store;
    this.refresh();
  }

  get enabled(): ReadonlyMap<string, LevelDefinition> {
    return this.available;
  }

  list(): AdminLevel[] {
    return [...this.all.keys()].map((id) => ({ id, enabled: this.available.has(id) }));
  }

  set(id: string, enabled: boolean): boolean {
    if (!this.store.setLevelEnabled(id, enabled, [...this.all.keys()])) {
      return false;
    }
    this.refresh();
    return true;
  }

  has(id: string): boolean {
    return this.all.has(id);
  }

  refresh(): boolean {
    const disabled = new Set(this.store.disabledLevels());
    const entries = [...this.all].filter(([id]) => !disabled.has(id));
    const changed =
      this.available.size !== entries.length || entries.some(([id]) => !this.available.has(id));
    if (changed) {
      this.available.clear();
      for (const [id, level] of entries) {
        this.available.set(id, level);
      }
    }
    return changed;
  }
}
