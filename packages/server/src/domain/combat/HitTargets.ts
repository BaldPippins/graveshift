import type { DestructibleCell } from '../entities/DestructibleCell.ts';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';

export interface HitTargets {
  readonly enemies: Iterable<EnemyEntity>;
  readonly players: Iterable<PlayerEntity>;
  readonly merchant: MerchantEntity | null;
  readonly traps: Iterable<TrapEntity>;
}

export interface MeleeTargets extends HitTargets {
  readonly obstacles: Iterable<DestructibleCell>;
}
