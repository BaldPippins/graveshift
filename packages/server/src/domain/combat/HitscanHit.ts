import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
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

export type HitscanHit = EnemyHit | PlayerHit | MerchantHit;
