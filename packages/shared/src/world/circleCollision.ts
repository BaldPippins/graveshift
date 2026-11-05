import { clamp } from '../core/scalarMath.ts';
import type { ReadonlyVec2, Vec2 } from '../core/Vec2.ts';
import { CollisionLayer } from './CollisionLayer.ts';
import type { TileMap } from './TileMap.ts';

const EPSILON = 1e-9;

function distanceSquaredToCell(position: ReadonlyVec2, cx: number, cy: number): number {
  const dx = position.x - clamp(position.x, cx, cx + 1);
  const dy = position.y - clamp(position.y, cy, cy + 1);
  return dx * dx + dy * dy;
}

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
  clearance = 0,
): void {
  const minCx = Math.floor(position.x - radius);
  const maxCx = Math.floor(position.x + radius);
  const minCy = Math.floor(position.y - radius);
  const maxCy = Math.floor(position.y + radius);
  for (let cy = minCy; cy <= maxCy; cy += 1) {
    for (let cx = minCx; cx <= maxCx; cx += 1) {
      if (map.isBlockedAbove(cx, cy, layer, clearance)) {
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
  clearance = 0,
): void {
  position.x += deltaX;
  resolveCircleAgainstMap(position, radius, map, layer, clearance);
  position.y += deltaY;
  resolveCircleAgainstMap(position, radius, map, layer, clearance);
}

export function groundHeightUnder(
  position: Vec2,
  radius: number,
  map: TileMap,
  clearance: number,
): number {
  let ground = 0;
  for (let cy = Math.floor(position.y - radius); cy <= Math.floor(position.y + radius); cy += 1) {
    for (let cx = Math.floor(position.x - radius); cx <= Math.floor(position.x + radius); cx += 1) {
      const height = map.obstacleHeight(cx, cy);
      const standable =
        height > ground &&
        height <= clearance &&
        map.isBlocked(cx, cy, CollisionLayer.Movement) &&
        distanceSquaredToCell(position, cx, cy) < radius * radius;
      if (standable) {
        ground = height;
      }
    }
  }
  return ground;
}

export function circleOverlapsCell(
  position: ReadonlyVec2,
  radius: number,
  cx: number,
  cy: number,
): boolean {
  return distanceSquaredToCell(position, cx, cy) < radius * radius;
}

export function clampInsideMap(position: Vec2, radius: number, map: TileMap): void {
  position.x = clamp(position.x, 1 + radius, map.width - 1 - radius);
  position.y = clamp(position.y, 1 + radius, map.height - 1 - radius);
}
