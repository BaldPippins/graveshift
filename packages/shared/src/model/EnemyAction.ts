import type { ValueOf } from '../core/ValueOf.ts';

export const EnemyAction = {
  Moving: 0,
  Attacking: 1,
  Snared: 2,
} as const;
export type EnemyAction = ValueOf<typeof EnemyAction>;
export const ENEMY_ACTIONS: readonly EnemyAction[] = Object.values(EnemyAction);
