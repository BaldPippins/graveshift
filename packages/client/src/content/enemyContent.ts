import { EnemyKind } from '@graveshift/shared/config';
import { ModelKey } from '../assets/ModelKey.ts';

export interface EnemyContent {
  readonly model: ModelKey;
  readonly opacity: number;
}

export const ENEMY_CONTENT: Readonly<Record<EnemyKind, EnemyContent>> = {
  [EnemyKind.Zombie]: {
    model: ModelKey.Zombie,
    opacity: 1,
  },
  [EnemyKind.Skeleton]: {
    model: ModelKey.Skeleton,
    opacity: 1,
  },
  [EnemyKind.Ghost]: {
    model: ModelKey.Ghost,
    opacity: 0.65,
  },
  [EnemyKind.Brute]: {
    model: ModelKey.Brute,
    opacity: 1,
  },
  [EnemyKind.Vampire]: {
    model: ModelKey.Vampire,
    opacity: 1,
  },
};

export const ENEMY_ICONS: Readonly<Record<EnemyKind, string>> = {
  [EnemyKind.Zombie]: '🧟',
  [EnemyKind.Skeleton]: '🦴',
  [EnemyKind.Ghost]: '👻',
  [EnemyKind.Brute]: '🪓',
  [EnemyKind.Vampire]: '🧛',
};
