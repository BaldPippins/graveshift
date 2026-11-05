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
  if (row === undefined || x < 0 || x >= level.width || row.charAt(x) === symbol) {
    return level;
  }
  const rows = [...level.rows];
  rows[y] = row.slice(0, x) + symbol + row.slice(x + 1);
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
