import { readdir, readFile } from 'node:fs/promises';
import { parseLevelDefinition } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';

export async function loadLevelCatalog(
  directory: URL,
): Promise<ReadonlyMap<string, LevelDefinition>> {
  const files = (await readdir(directory)).filter((file) => file.endsWith('.json')).sort();
  const levels = new Map<string, LevelDefinition>();
  for (const file of files) {
    const level = parseLevelDefinition(await readFile(new URL(file, directory), 'utf8'));
    if (levels.has(level.id)) {
      throw new Error(`Duplicate level id: ${level.id}`);
    }
    levels.set(level.id, level);
  }
  if (levels.size === 0) {
    throw new Error('Level catalog is empty');
  }
  return levels;
}
