import type { ReadonlyVec2 } from './Vec2.ts';
import { distanceSquared } from './vectorMath.ts';

export interface NearestOptions<T> {
  readonly maxDistance?: number;
  readonly accept?: (item: T) => boolean;
}

export function nearestTo<T>(
  origin: ReadonlyVec2,
  items: Iterable<T>,
  positionOf: (item: T) => ReadonlyVec2,
  options: NearestOptions<T> = {},
): T | null {
  const maxDistance = options.maxDistance ?? Number.POSITIVE_INFINITY;
  let best: T | null = null;
  let bestDistance = maxDistance * maxDistance;
  for (const item of items) {
    const candidate = distanceSquared(origin, positionOf(item));
    if (candidate < bestDistance && (options.accept === undefined || options.accept(item))) {
      best = item;
      bestDistance = candidate;
    }
  }
  return best;
}
