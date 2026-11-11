import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminSettingsStore } from './AdminSettingsStore.ts';

const directories: string[] = [];

async function directory(): Promise<string> {
  const path = await mkdtemp(`${tmpdir()}/graveshift-admin-`);
  directories.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe('admin settings', () => {
  it('persists availability and shares it across server instances', async () => {
    const path = `${await directory()}/nested/levels.json`;
    const first = new AdminSettingsStore(path);
    const second = new AdminSettingsStore(path);
    expect(first.setLevelEnabled('graveyard', false, ['graveyard', 'arena'])).toBe(true);
    expect(second.disabledLevels()).toEqual(['graveyard']);
    expect(second.setLevelEnabled('arena', false, ['graveyard', 'arena'])).toBe(false);
    expect(first.disabledLevels()).toEqual(['graveyard']);
    const restarted = new AdminSettingsStore(path);
    expect(restarted.disabledLevels()).toEqual(['graveyard']);
    expect(restarted.setLevelEnabled('graveyard', true, ['graveyard', 'arena'])).toBe(true);
    expect(first.disabledLevels()).toEqual([]);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual([{ id: 'graveyard', enabled: true }]);
  });

  it('ignores a lock file left by an earlier version', async () => {
    const path = `${await directory()}/levels.json`;
    await writeFile(`${path}.lock`, 'stale');
    const store = new AdminSettingsStore(path);
    expect(store.setLevelEnabled('graveyard', false, ['graveyard', 'arena'])).toBe(true);
    expect(store.disabledLevels()).toEqual(['graveyard']);
  });

  it('does not replace malformed settings', async () => {
    const path = `${await directory()}/levels.json`;
    await writeFile(path, '{broken');
    const store = new AdminSettingsStore(path);
    expect(() => store.disabledLevels()).toThrow();
    expect(() => store.setLevelEnabled('arena', true, ['graveyard', 'arena'])).toThrow();
    expect(await readFile(path, 'utf8')).toBe('{broken');
  });
});
