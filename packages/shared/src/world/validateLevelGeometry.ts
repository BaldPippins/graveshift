import { CollisionLayer } from './CollisionLayer.ts';
import type { LevelGeometryIssue } from './LevelGeometry.ts';
import { TileKind, TILE_KINDS } from './TileKind.ts';
import { TILE_TRAITS } from './tileTraits.ts';

const KIND_BY_SYMBOL = new Map(TILE_KINDS.map((kind) => [TILE_TRAITS[kind].symbol, kind]));
const MIN_SIZE = 8;
const MAX_SIZE = 64;
const MAX_OBSTACLES = 1024;
const MAX_TRAPS = 256;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validSize(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= MIN_SIZE && value <= MAX_SIZE
  );
}

function checkConnectivity(
  tiles: readonly TileKind[],
  width: number,
  issues: LevelGeometryIssue[],
): void {
  const start = tiles.indexOf(TileKind.PlayerSpawn);
  if (start < 0) {
    return;
  }
  const visited = new Set<number>([start]);
  const queue = [start];
  for (const index of queue) {
    const x = index % width;
    const y = Math.floor(index / width);
    for (const [nx, ny] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ] as const) {
      const next = ny * width + nx;
      const kind = tiles[next];
      if (nx < 0 || nx >= width || ny < 0 || kind === undefined || visited.has(next)) {
        continue;
      }
      if (!TILE_TRAITS[kind].blocks[CollisionLayer.Movement]) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  const walkable = tiles.filter((kind) => !TILE_TRAITS[kind].blocks[CollisionLayer.Movement]);
  if (visited.size !== walkable.length) {
    issues.push({ path: 'connectivity', code: 'disconnected' });
    tiles.forEach((kind, index) => {
      if (!TILE_TRAITS[kind].blocks[CollisionLayer.Movement] && !visited.has(index)) {
        issues.push({
          path: `rows.${Math.floor(index / width)}.${index % width}`,
          code: 'disconnected',
        });
      }
    });
  }
}

export function validateLevelGeometry(value: unknown): LevelGeometryIssue[] {
  if (!isRecord(value)) {
    return [{ path: '', code: 'invalid' }];
  }
  const issues: LevelGeometryIssue[] = [];
  if (
    typeof value['id'] !== 'string' ||
    value['id'].length > 255 ||
    !/^[a-z0-9][a-z0-9-]*$/.test(value['id'])
  ) {
    issues.push({ path: 'id', code: 'invalid' });
  }
  const width = value['width'];
  const height = value['height'];
  if (!validSize(width)) {
    issues.push({ path: 'width', code: 'invalid' });
  }
  if (!validSize(height)) {
    issues.push({ path: 'height', code: 'invalid' });
  }
  const orientations = value['orientations'];
  if (orientations !== undefined) {
    if (!Array.isArray(orientations) || orientations.length > MAX_SIZE * MAX_SIZE) {
      issues.push({ path: 'orientations', code: 'invalid' });
    } else {
      const cells = new Set<string>();
      orientations.forEach((item: unknown, index) => {
        if (
          !isRecord(item) ||
          !Number.isInteger(item['x']) ||
          !Number.isInteger(item['y']) ||
          typeof item['x'] !== 'number' ||
          typeof item['y'] !== 'number' ||
          !validSize(width) ||
          !validSize(height) ||
          item['x'] < 0 ||
          item['x'] >= width ||
          item['y'] < 0 ||
          item['y'] >= height ||
          !Number.isInteger(item['quarterTurns']) ||
          typeof item['quarterTurns'] !== 'number' ||
          item['quarterTurns'] < 0 ||
          item['quarterTurns'] > 3 ||
          cells.has(`${item['x']},${item['y']}`)
        ) {
          issues.push({ path: `orientations.${index}`, code: 'invalid' });
          return;
        }
        cells.add(`${item['x']},${item['y']}`);
      });
    }
  }
  const rows: unknown = value['rows'];
  if (!Array.isArray(rows)) {
    return [...issues, { path: 'rows', code: 'invalid' }];
  }
  if (rows.length !== height) {
    issues.push({ path: 'rows', code: 'invalid-height' });
  }
  const tiles: TileKind[] = [];
  let obstacles = 0;
  let traps = 0;
  for (const [y, row] of rows.entries()) {
    if (typeof row !== 'string') {
      issues.push({ path: `rows.${y}`, code: 'invalid' });
      continue;
    }
    if (row.length !== width) {
      issues.push({ path: `rows.${y}`, code: 'invalid-width' });
    }
    for (let x = 0; x < row.length; x += 1) {
      const kind = KIND_BY_SYMBOL.get(row.charAt(x));
      if (kind === undefined) {
        issues.push({ path: `rows.${y}.${x}`, code: 'unknown-tile' });
        continue;
      }
      tiles.push(kind);
      if (TILE_TRAITS[kind].durability !== null) {
        obstacles += 1;
      }
      if (kind === TileKind.PowderKegSpot || kind === TileKind.BearTrapSpot) {
        traps += 1;
      }
    }
  }
  if (!tiles.includes(TileKind.PlayerSpawn) || !tiles.includes(TileKind.EnemySpawn)) {
    issues.push({ path: 'spawns', code: 'missing' });
  }
  if (obstacles > MAX_OBSTACLES) {
    issues.push({ path: 'rows', code: 'too-many-obstacles' });
  }
  if (traps > MAX_TRAPS) {
    issues.push({ path: 'rows', code: 'too-many-traps' });
  }
  if (issues.length === 0 && validSize(width)) {
    checkConnectivity(tiles, width, issues);
  }
  return issues;
}
