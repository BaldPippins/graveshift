import { randomUUID } from 'node:crypto';
import { readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { parseLevelDefinition } from '@graveshift/shared/world';

export async function saveLevel(
  directory: string,
  json: string,
  overwrite: boolean,
): Promise<void> {
  const level = parseLevelDefinition(json);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.json'));
  const existing = await Promise.all(
    files.map(async (file) => ({
      file,
      level: parseLevelDefinition(await readFile(join(directory, file), 'utf8')),
    })),
  );
  const matches = existing.filter((entry) => entry.level.id === level.id);
  if (matches.length > 1 || (matches.length === 0 && files.length >= 64)) {
    throw new Error('catalog');
  }
  if (matches.length > 0 && !overwrite) {
    throw new Error('exists');
  }
  const match = matches[0];
  const filename = match === undefined ? `${level.id}.json` : match.file;
  if (match === undefined && files.includes(filename)) {
    throw new Error('catalog');
  }
  const target = join(directory, filename);
  const options = await resolveConfig(target);
  const formatted = await format(JSON.stringify(level), { ...options, filepath: target });
  const temp = join(directory, `.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, formatted, { flag: 'wx' });
    await rename(temp, target);
  } finally {
    await unlink(temp).catch(() => undefined);
  }
}
