import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';

export function createEmptyLevel(): LevelDefinition {
  const width = 32;
  const height = 24;
  const rows = Array.from({ length: height }, (_, y) => {
    if (y === 0 || y === height - 1) {
      return '#'.repeat(width);
    }
    const interior = '.'.repeat(width - 2).split('');
    if (y === 1) {
      interior[0] = 'P';
      interior[width - 3] = 'S';
    }
    return `#${interior.join('')}#`;
  });
  return { ...structuredClone(GRAVEYARD_LEVEL), id: 'untitled', width, height, rows };
}

export function paintCell(
  level: LevelDefinition,
  x: number,
  y: number,
  symbol: string,
): LevelDefinition {
  const row = level.rows[y];
  if (y < 0 || y >= level.height || x < 0 || x >= level.width) {
    return level;
  }
  const normalized = (row ?? '').slice(0, level.width).padEnd(level.width, '.');
  if (normalized === row && normalized.charAt(x) === symbol) {
    return level;
  }
  const rows = [...level.rows];
  while (rows.length <= y) {
    rows.push('.'.repeat(level.width));
  }
  rows[y] = normalized.slice(0, x) + symbol + normalized.slice(x + 1);
  return { ...level, rows };
}

export function resizeLevel(
  level: LevelDefinition,
  width: number,
  height: number,
): LevelDefinition {
  const rows = Array.from({ length: height }, (_, y) =>
    (level.rows[y] ?? '').slice(0, width).padEnd(width, '.'),
  );
  return { ...level, width, height, rows };
}

export function wouldCrop(level: LevelDefinition, width: number, height: number): boolean {
  return level.rows.some((row, y) => /[^.]/.test(y >= height ? row : row.slice(width)));
}
