import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { AdminSettingsStore } from './AdminSettingsStore.ts';
import { migrateAdminSettings } from './migrateAdminSettings.ts';

const directories: string[] = [];
const execFileAsync = promisify(execFile);

async function directory(): Promise<string> {
  const path = await mkdtemp(`${tmpdir()}/graveshift-admin-`);
  directories.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe('admin settings', () => {
  it('rejects any existing lock without changing settings', async () => {
    const path = `${await directory()}/levels.json`;
    const store = new AdminSettingsStore(path);
    await writeFile(`${path}.lock`, 'damaged');
    expect(() => store.setLevelEnabled('graveyard', false, ['graveyard', 'arena'])).toThrow();
    expect(store.disabledLevels()).toEqual([]);
  });

  it('persists availability and shares it across server instances', async () => {
    const path = `${await directory()}/levels.json`;
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

  it('prevents concurrent processes from disabling the last two maps', async () => {
    const path = `${await directory()}/levels.json`;
    const moduleUrl = new URL('./AdminSettingsStore.ts', import.meta.url).href;
    const source =
      `import { AdminSettingsStore } from ${JSON.stringify(moduleUrl)};` +
      'const store = new AdminSettingsStore(process.argv[1]);' +
      "try { const result = store.setLevelEnabled(process.argv[2], false, ['a', 'b']);" +
      'process.stdout.write(String(result)); }' +
      "catch { process.stdout.write('busy'); }";
    const processes = ['a', 'b'].map((id) =>
      execFileAsync(process.execPath, ['--input-type=module', '--eval', source, path, id]),
    );
    const results = await Promise.all(processes);
    expect(results.filter((result) => result.stdout === 'true')).toHaveLength(1);
    expect(new AdminSettingsStore(path).disabledLevels()).toHaveLength(1);
  });

  it('preserves both concurrent updates when a busy writer retries', async () => {
    const path = `${await directory()}/levels.json`;
    const moduleUrl = new URL('./AdminSettingsStore.ts', import.meta.url).href;
    const source =
      `import { AdminSettingsStore } from ${JSON.stringify(moduleUrl)};` +
      'const store = new AdminSettingsStore(process.argv[1]);' +
      'for (let attempt = 0; attempt < 100; attempt += 1) {' +
      'try { process.stdout.write(String(store.setLevelEnabled(' +
      "process.argv[2], false, ['a', 'b', 'c']))); break; }" +
      "catch (error) { if (error.code !== 'EEXIST') throw error; " +
      'await new Promise((resolve) => setTimeout(resolve, 10)); } }';
    const results = await Promise.all(
      ['a', 'b'].map((id) =>
        execFileAsync(process.execPath, ['--input-type=module', '--eval', source, path, id]),
      ),
    );
    expect(results.map((result) => result.stdout)).toEqual(['true', 'true']);
    expect(new AdminSettingsStore(path).disabledLevels().sort()).toEqual(['a', 'b']);
  });

  it('does not replace malformed settings', async () => {
    const path = `${await directory()}/levels.json`;
    await writeFile(path, '{broken');
    const store = new AdminSettingsStore(path);
    expect(() => store.disabledLevels()).toThrow();
    expect(() => store.setLevelEnabled('arena', true, ['graveyard', 'arena'])).toThrow();
    expect(await readFile(path, 'utf8')).toBe('{broken');
  });

  it('migrates sqlite data once without modifying the original database', async () => {
    const root = await directory();
    const source = `${root}/admin.sqlite`;
    const target = `${root}/levels.json`;
    const database = new DatabaseSync(source);
    database.exec('CREATE TABLE feature_switches (namespace TEXT, key TEXT, enabled INTEGER)');
    database.exec("INSERT INTO feature_switches VALUES ('levels', 'graveyard', 0)");
    database.exec("INSERT INTO feature_switches VALUES ('levels', 'arena', 1)");
    database.close();
    migrateAdminSettings(source, target);
    expect(new AdminSettingsStore(target).disabledLevels()).toEqual(['graveyard']);
    expect(() => {
      migrateAdminSettings(source, target);
    }).toThrow();
    const original = new DatabaseSync(source, { readOnly: true });
    expect(original.prepare('SELECT * FROM feature_switches').all()).toHaveLength(2);
    original.close();
  });

  it('resolves migration CLI paths from the repository root', async () => {
    const root = await directory();
    const source = `${root}/admin.sqlite`;
    const target = `${root}/levels.json`;
    const database = new DatabaseSync(source);
    database.exec('CREATE TABLE feature_switches (namespace TEXT, key TEXT, enabled INTEGER)');
    database.exec("INSERT INTO feature_switches VALUES ('levels', 'graveyard', 0)");
    database.close();
    const repository = resolve(import.meta.dirname, '../../../../../');
    await execFileAsync(
      process.execPath,
      [
        'scripts/migrateAdminSettings.ts',
        relative(repository, source),
        relative(repository, target),
      ],
      { cwd: resolve(repository, 'packages/server') },
    );
    expect(new AdminSettingsStore(target).disabledLevels()).toEqual(['graveyard']);
  });
});
