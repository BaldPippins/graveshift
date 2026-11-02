import type { ValueOf } from '../core/ValueOf.ts';

export const CollisionLayer = {
  Movement: 0,
  Projectiles: 1,
} as const;
export type CollisionLayer = ValueOf<typeof CollisionLayer>;
