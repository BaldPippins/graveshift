import { EnemyKind } from '@graveshift/shared/config';
import { ModelKey } from '../assets/ModelKey.ts';

export interface FlightStyle {
  readonly cruiseHeight: number;
  readonly diveHeight: number;
  readonly climbSharpness: number;
}

export interface EnemyContent {
  readonly model: ModelKey;
  readonly opacity: number;
  readonly flight: FlightStyle | null;
}

export const ENEMY_CONTENT: Readonly<Record<EnemyKind, EnemyContent>> = {
  [EnemyKind.Zombie]: {
    model: ModelKey.Zombie,
    opacity: 1,
    flight: null,
  },
  [EnemyKind.Skeleton]: {
    model: ModelKey.Skeleton,
    opacity: 1,
    flight: null,
  },
  [EnemyKind.Ghost]: {
    model: ModelKey.Ghost,
    opacity: 0.65,
    flight: null,
  },
  [EnemyKind.Brute]: {
    model: ModelKey.Brute,
    opacity: 1,
    flight: null,
  },
  [EnemyKind.Vampire]: {
    model: ModelKey.Vampire,
    opacity: 1,
    flight: null,
  },
  [EnemyKind.Bat]: {
    model: ModelKey.Bat,
    opacity: 1,
    flight: { cruiseHeight: 1.35, diveHeight: 0.45, climbSharpness: 6 },
  },
};

export const ENEMY_ICONS: Readonly<Record<EnemyKind, string>> = {
  [EnemyKind.Zombie]: '🧟',
  [EnemyKind.Skeleton]: '🦴',
  [EnemyKind.Ghost]: '👻',
  [EnemyKind.Brute]: '🪓',
  [EnemyKind.Vampire]: '🧛',
  [EnemyKind.Bat]: '🦇',
};
