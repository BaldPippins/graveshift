import { closeSync, fstatSync, openSync, readFileSync, statSync } from 'node:fs';
import type { BigIntStats } from 'node:fs';
import type { AdminLevelSetting } from './AdminLevelSetting.ts';
import { writeAdminSettings } from './adminSettingsFile.ts';

function signature(stat: BigIntStats): string {
  return `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
}

function parseSettings(json: string): AdminLevelSetting[] {
  const value: unknown = JSON.parse(json);
  if (!Array.isArray(value)) {
    throw new Error('Invalid level settings');
  }
  const entries: AdminLevelSetting[] = [];
  const ids = new Set<string>();
  for (const item of value as unknown[]) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('id' in item) ||
      typeof item.id !== 'string' ||
      item.id.length === 0 ||
      !('enabled' in item) ||
      typeof item.enabled !== 'boolean' ||
      ids.has(item.id)
    ) {
      throw new Error('Invalid level settings');
    }
    ids.add(item.id);
    entries.push({ id: item.id, enabled: item.enabled });
  }
  return entries;
}

export class AdminSettingsStore {
  private readonly path: string;
  private cached: AdminLevelSetting[] = [];
  private cachedSignature = '';

  constructor(path: string) {
    this.path = path;
  }

  disabledLevels(): string[] {
    return this.read()
      .filter((entry) => !entry.enabled)
      .map((entry) => entry.id);
  }

  setLevelEnabled(id: string, enabled: boolean, knownIds: readonly string[]): boolean {
    if (!knownIds.includes(id)) {
      return false;
    }
    const entries = this.read(true);
    const disabled = new Set(entries.filter((entry) => !entry.enabled).map((entry) => entry.id));
    if (!enabled) {
      disabled.add(id);
      if (!knownIds.some((known) => !disabled.has(known))) {
        return false;
      }
    }
    const updated = entries.filter((entry) => entry.id !== id);
    updated.push({ id, enabled });
    if (this.path !== ':memory:') {
      writeAdminSettings(this.path, updated);
      this.cachedSignature = '';
    }
    this.cached = updated;
    return true;
  }

  private read(force = false): AdminLevelSetting[] {
    if (this.path === ':memory:') {
      return this.cached;
    }
    const stat = statSync(this.path, { bigint: true, throwIfNoEntry: false });
    if (stat === undefined) {
      this.cached = [];
      this.cachedSignature = '';
      return this.cached;
    }
    if (!force && signature(stat) === this.cachedSignature) {
      return this.cached;
    }
    const descriptor = openSync(this.path, 'r');
    try {
      const data = parseSettings(readFileSync(descriptor, 'utf8'));
      this.cachedSignature = signature(fstatSync(descriptor, { bigint: true }));
      this.cached = data;
      return data;
    } finally {
      closeSync(descriptor);
    }
  }
}
