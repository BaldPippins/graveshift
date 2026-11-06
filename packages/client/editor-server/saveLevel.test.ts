import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import graveyard from '../../shared/src/world/maps/graveyard.json' with { type: 'json' };
import { saveLevel } from './saveLevel.ts';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('save level', () => {
  it('saves a valid level and requires confirmation before replacing it', async () => {
    const directory = await mkdtemp(`${tmpdir()}/graveshift-editor-save-`);
    directories.push(directory);
    const json = JSON.stringify({ ...graveyard, id: 'test-map' });
    await saveLevel(directory, json, false);
    expect(JSON.parse(await readFile(`${directory}/test-map.json`, 'utf8'))).toEqual(
      JSON.parse(json),
    );
    await expect(saveLevel(directory, json, false)).rejects.toThrow('exists');
    const revised = {
      ...graveyard,
      id: 'test-map',
      waves: { ...graveyard.waves, countdownSeconds: 5 },
    };
    await saveLevel(directory, JSON.stringify(revised), true);
    expect(JSON.parse(await readFile(`${directory}/test-map.json`, 'utf8'))).toEqual(revised);
  });

  it('rejects invalid levels and never overwrites another identifier', async () => {
    const directory = await mkdtemp(`${tmpdir()}/graveshift-editor-save-`);
    directories.push(directory);
    const original = JSON.stringify(graveyard);
    await writeFile(`${directory}/test-map.json`, original);
    await expect(saveLevel(directory, '{"id":"../test"}', false)).rejects.toThrow();
    await expect(
      saveLevel(directory, JSON.stringify({ ...graveyard, id: 'test-map' }), false),
    ).rejects.toThrow('catalog');
    expect(await readFile(`${directory}/test-map.json`, 'utf8')).toBe(original);
  });
});
