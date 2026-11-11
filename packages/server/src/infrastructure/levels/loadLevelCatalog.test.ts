import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import graveyard from '../../../../shared/src/world/maps/graveyard.json' with { type: 'json' };
import { loadLevelCatalog } from './loadLevelCatalog.ts';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('level catalog', () => {
  it('loads and validates JSON levels', async () => {
    const directory = await mkdtemp(`${tmpdir()}/graveshift-levels-`);
    directories.push(directory);
    await writeFile(`${directory}/graveyard.json`, JSON.stringify(graveyard));
    const levels = await loadLevelCatalog(pathToFileURL(`${directory}/`));
    expect(levels.get('graveyard')).toEqual(graveyard);
  });

  it('rejects duplicate identifiers and invalid files', async () => {
    const directory = await mkdtemp(`${tmpdir()}/graveshift-levels-`);
    directories.push(directory);
    await writeFile(`${directory}/a.json`, JSON.stringify(graveyard));
    await writeFile(`${directory}/b.json`, JSON.stringify(graveyard));
    await expect(loadLevelCatalog(pathToFileURL(`${directory}/`))).rejects.toThrow('Duplicate');
    await writeFile(`${directory}/b.json`, '{}');
    await expect(loadLevelCatalog(pathToFileURL(`${directory}/`))).rejects.toThrow('Invalid level');
  });
});
