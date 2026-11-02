import { clamp } from '../core/scalarMath.ts';
import type { Vec2 } from '../core/Vec2.ts';
import type { CollisionLayer } from './CollisionLayer.ts';
import type { TileMap } from './TileMap.ts';

const EPSILON = 1e-9;

function pushOutOfCell(position: Vec2, radius: number, cx: number, cy: number): void {
  const nearestX = clamp(position.x, cx, cx + 1);
  const nearestY = clamp(position.y, cy, cy + 1);
  const dx = position.x - nearestX;
  const dy = position.y - nearestY;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= radius * radius) {
    return;
  }
  if (distanceSquared > EPSILON) {
    const distance = Math.sqrt(distanceSquared);
    const push = radius - distance;
    position.x += (dx / distance) * push;
    position.y += (dy / distance) * push;
    return;
  }
  const exits = [
    { axis: 'x', delta: cx - radius - position.x },
    { axis: 'x', delta: cx + 1 + radius - position.x },
    { axis: 'y', delta: cy - radius - position.y },
    { axis: 'y', delta: cy + 1 + radius - position.y },
  ] as const;
  const shortest = exits.reduce((best, exit) =>
    Math.abs(exit.delta) < Math.abs(best.delta) ? exit : best,
  );
  position[shortest.axis] += shortest.delta;
}

export function resolveCircleAgainstMap(
  position: Vec2,
  radius: number,
  map: TileMap,
  layer: CollisionLayer,
): void {
  const minCx = Math.floor(position.x - radius);
  const maxCx = Math.floor(position.x + radius);
  const minCy = Math.floor(position.y - radius);
  const maxCy = Math.floor(position.y + radius);
  for (let cy = minCy; cy <= maxCy; cy += 1) {
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      if (map.isBlocked(cx, cy, layer)) {
        pushOutOfCell(position, radius, cx, cy);
      }
    }
  }
}

export function moveCircle(
  position: Vec2,
  deltaX: number,
  deltaY: number,
  radius: number,
  map: TileMap,
  layer: CollisionLayer,
): void {
  position.x += deltaX;
  resolveCircleAgainstMap(position, radius, map, layer);
  position.y += deltaY;
  resolveCircleAgainstMap(position, radius, map, layer);
}

export function clampInsideMap(position: Vec2, radius: number, map: TileMap): void {
  position.x = clamp(position.x, 1 + radius, map.width - 1 - radius);
  position.y = clamp(position.y, 1 + radius, map.height - 1 - radius);
}
