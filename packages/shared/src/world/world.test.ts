import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../core/Vec2.ts';
import { moveCircle } from './circleCollision.ts';
import { CollisionLayer } from './CollisionLayer.ts';
import { MapId } from './MapDefinition.ts';
import { MAP_DEFINITIONS } from './mapCatalog.ts';
import { parseTileMap } from './parseTileMap.ts';
import { castRayAgainstMap, hasLineOfSight, rayCircleIntersection } from './raycast.ts';
import type { TileMap } from './TileMap.ts';

const corridor = parseTileMap({
  id: MapId.Graveyard,
  rows: ['#######', '#P...S#', '#..#..#', '#######'],
});

function reachableWalkableCells(map: TileMap): number {
  const start = map.playerSpawns[0];
  if (start === undefined) {
    return 0;
  }
  const visited = new Uint8Array(map.cellCount);
  const queue = [map.indexOf(start.cx, start.cy)];
  visited[queue[0] ?? 0] = 1;
  let count = 0;
  while (queue.length > 0) {
    const index = queue.pop() ?? 0;
    count += 1;
    const { cx, cy } = map.cellOfIndex(index);
    for (const [nx, ny] of [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ] as const) {
      const neighbor = map.indexOf(nx, ny);
      if (
        map.isInside(nx, ny) &&
        visited[neighbor] === 0 &&
        !map.isBlocked(nx, ny, CollisionLayer.Movement)
      ) {
        visited[neighbor] = 1;
        queue.push(neighbor);
      }
    }
  }
  return count;
}

function walkableCells(map: TileMap): number {
  let count = 0;
  for (let index = 0; index < map.cellCount; index += 1) {
    if (!map.isBlockedAtIndex(index, CollisionLayer.Movement)) {
      count += 1;
    }
  }
  return count;
}

describe('tile map', () => {
  it('parses spawns and dimensions', () => {
    expect(corridor.width).toBe(7);
    expect(corridor.height).toBe(4);
    expect(corridor.playerSpawns).toEqual([{ cx: 1, cy: 1 }]);
    expect(corridor.enemySpawns).toEqual([{ cx: 5, cy: 1 }]);
  });

  it('rejects ragged rows and unknown symbols', () => {
    expect(() => parseTileMap({ id: MapId.Graveyard, rows: ['#P#', '#S'] })).toThrow();
    expect(() => parseTileMap({ id: MapId.Graveyard, rows: ['#P?S#'] })).toThrow();
  });

  it.each(Object.values(MAP_DEFINITIONS))('map $id is fully connected', (definition) => {
    const map = parseTileMap(definition);
    expect(reachableWalkableCells(map)).toBe(walkableCells(map));
  });
});

describe('raycast', () => {
  it('stops bullets at gravestones and other solid props', () => {
    const graveyard = parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]);
    const distance = castRayAgainstMap(
      graveyard,
      { x: 1.5, y: 3.5 },
      { x: 1, y: 0 },
      10,
      CollisionLayer.Projectiles,
    );
    expect(distance).toBeCloseTo(2.5);
  });

  it('stops at the first blocking cell boundary', () => {
    const distance = castRayAgainstMap(
      corridor,
      { x: 1.5, y: 1.5 },
      { x: 1, y: 0 },
      100,
      CollisionLayer.Movement,
    );
    expect(distance).toBeCloseTo(4.5);
  });

  it('respects max distance', () => {
    expect(
      castRayAgainstMap(corridor, { x: 1.5, y: 1.5 }, { x: 1, y: 0 }, 2, CollisionLayer.Movement),
    ).toBe(2);
  });

  it('detects occlusion', () => {
    expect(
      hasLineOfSight(corridor, { x: 1.5, y: 2.5 }, { x: 5.5, y: 2.5 }, CollisionLayer.Movement),
    ).toBe(false);
    expect(
      hasLineOfSight(corridor, { x: 1.5, y: 1.5 }, { x: 5.5, y: 1.5 }, CollisionLayer.Movement),
    ).toBe(true);
  });

  it('intersects circles', () => {
    expect(rayCircleIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 0 }, 1)).toBeCloseTo(4);
    expect(rayCircleIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: 2 }, 1)).toBeNull();
    expect(rayCircleIntersection({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -5, y: 0 }, 1)).toBeNull();
  });
});

describe('circle collision', () => {
  it('slides along walls without penetrating', () => {
    const position: Vec2 = { x: 2.5, y: 1.5 };
    for (let step = 0; step < 20; step += 1) {
      moveCircle(position, 0.05, -0.1, 0.3, corridor, CollisionLayer.Movement);
    }
    expect(position.y).toBeCloseTo(1.3);
    expect(position.x).toBeGreaterThan(3.4);
  });

  it('cannot pass through an internal pillar', () => {
    const position: Vec2 = { x: 2.5, y: 2.5 };
    for (let step = 0; step < 30; step += 1) {
      moveCircle(position, 0.1, 0, 0.3, corridor, CollisionLayer.Movement);
    }
    expect(position.x).toBeLessThanOrEqual(2.7 + 1e-9);
  });
});
