import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminSettingsStore } from './AdminSettingsStore.ts';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('admin settings', () => {
  it('rejects a competing write without corrupting stored settings', async () => {
    const directory = await mkdtemp(`${tmpdir()}/graveshift-admin-`);
    directories.push(directory);
    const path = `${directory}/settings.sqlite`;
    const store = new AdminSettingsStore(path);
    const lock = new DatabaseSync(path);
    lock.exec('BEGIN IMMEDIATE');
    expect(() => store.setLevelEnabled('graveyard', false, ['graveyard', 'arena'])).toThrow();
    lock.exec('ROLLBACK');
    expect(store.disabledLevels()).toEqual([]);
    lock.close();
    store.close();
  });

  it('persists availability and shares it across server instances', async () => {
    const directory = await mkdtemp(`${tmpdir()}/graveshift-admin-`);
    directories.push(directory);
    const first = new AdminSettingsStore(`${directory}/settings.sqlite`);
    const second = new AdminSettingsStore(`${directory}/settings.sqlite`);
    expect(first.setLevelEnabled('graveyard', false, ['graveyard', 'arena'])).toBe(true);
    expect(second.disabledLevels()).toEqual(['graveyard']);
    expect(second.setLevelEnabled('arena', false, ['graveyard', 'arena'])).toBe(false);
    expect(first.disabledLevels()).toEqual(['graveyard']);
    first.close();
    second.close();
    const restarted = new AdminSettingsStore(`${directory}/settings.sqlite`);
    expect(restarted.disabledLevels()).toEqual(['graveyard']);
    expect(restarted.setLevelEnabled('graveyard', true, ['graveyard', 'arena'])).toBe(true);
    expect(restarted.disabledLevels()).toEqual([]);
    restarted.close();
  });
});
