import type { ReadonlyVec2 } from '../core/Vec2.ts';
import type { CollisionLayer } from './CollisionLayer.ts';
import type { TileMap } from './TileMap.ts';

function boundaryDistance(origin: number, direction: number, cell: number): number {
  if (direction > 0) {
    return (cell + 1 - origin) / direction;
  }
  if (direction < 0) {
    return (origin - cell) / -direction;
  }
  return Number.POSITIVE_INFINITY;
}

export function castRayAgainstMap(
  map: TileMap,
  origin: ReadonlyVec2,
  direction: ReadonlyVec2,
  maxDistance: number,
  layer: CollisionLayer,
): number {
  let cx = Math.floor(origin.x);
  let cy = Math.floor(origin.y);
  if (map.isBlocked(cx, cy, layer)) {
    return 0;
  }
  const stepX = Math.sign(direction.x);
  const stepY = Math.sign(direction.y);
  const deltaX = direction.x === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / direction.x);
  const deltaY = direction.y === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / direction.y);
  let nextX = boundaryDistance(origin.x, direction.x, cx);
  let nextY = boundaryDistance(origin.y, direction.y, cy);

  for (;;) {
    const travelled = Math.min(nextX, nextY);
    if (travelled >= maxDistance) {
      return maxDistance;
    }
    if (nextX < nextY) {
      cx += stepX;
      nextX += deltaX;
    } else {
      cy += stepY;
      nextY += deltaY;
    }
    if (map.isBlocked(cx, cy, layer)) {
      return travelled;
    }
  }
}

export function hasLineOfSight(
  map: TileMap,
  from: ReadonlyVec2,
  to: ReadonlyVec2,
  layer: CollisionLayer,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return true;
  }
  const direction = { x: dx / length, y: dy / length };
  return castRayAgainstMap(map, from, direction, length, layer) >= length;
}

export function rayCircleIntersection(
  origin: ReadonlyVec2,
  direction: ReadonlyVec2,
  center: ReadonlyVec2,
  radius: number,
): number | null {
  const toCenterX = center.x - origin.x;
  const toCenterY = center.y - origin.y;
  const projection = toCenterX * direction.x + toCenterY * direction.y;
  const perpendicularSquared =
    toCenterX * toCenterX + toCenterY * toCenterY - projection * projection;
  const radiusSquared = radius * radius;
  if (perpendicularSquared > radiusSquared) {
    return null;
  }
  const halfChord = Math.sqrt(radiusSquared - perpendicularSquared);
  const near = projection - halfChord;
  if (near >= 0) {
    return near;
  }
  const far = projection + halfChord;
  return far >= 0 ? 0 : null;
}
