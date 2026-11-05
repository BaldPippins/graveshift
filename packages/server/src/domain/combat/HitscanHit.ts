import type { DestructibleCell } from '../entities/DestructibleCell.ts';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';
import type { HitKind } from './HitKind.ts';

export interface EnemyHit {
  readonly kind: typeof HitKind.Enemy;
  readonly enemy: EnemyEntity;
  readonly distance: number;
}

export interface PlayerHit {
  readonly kind: typeof HitKind.Player;
  readonly player: PlayerEntity;
  readonly distance: number;
}

export interface MerchantHit {
  readonly kind: typeof HitKind.Merchant;
  readonly merchant: MerchantEntity;
  readonly distance: number;
}

export interface ObstacleHit {
  readonly kind: typeof HitKind.Obstacle;
  readonly obstacle: DestructibleCell;
  readonly distance: number;
}

export interface TrapHit {
  readonly kind: typeof HitKind.Trap;
  readonly trap: TrapEntity;
  readonly distance: number;
}

export type HitscanHit = EnemyHit | PlayerHit | MerchantHit | ObstacleHit | TrapHit;
