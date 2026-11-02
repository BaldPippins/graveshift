import type { ReadonlyVec2, Vec2 } from './Vec2.ts';

export function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

export function lengthOf(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function distanceSquared(a: ReadonlyVec2, b: ReadonlyVec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function distance(a: ReadonlyVec2, b: ReadonlyVec2): number {
  return Math.sqrt(distanceSquared(a, b));
}

export function clampLength(target: Vec2, maxLength: number): Vec2 {
  const length = lengthOf(target.x, target.y);
  if (length > maxLength && length > 0) {
    const scale = maxLength / length;
    target.x *= scale;
    target.y *= scale;
  }
  return target;
}

export function directionFromAngle(angle: number, target: Vec2 = vec2()): Vec2 {
  target.x = Math.cos(angle);
  target.y = Math.sin(angle);
  return target;
}

export function angleBetween(from: ReadonlyVec2, to: ReadonlyVec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function directionTo(from: ReadonlyVec2, to: ReadonlyVec2, target: Vec2): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  target.x = length > 0 ? dx / length : 0;
  target.y = length > 0 ? dy / length : 0;
  return length;
}

export function lerpPoint(from: ReadonlyVec2, to: ReadonlyVec2, t: number): Vec2 {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
