import type { WeaponId } from '@graveshift/shared/config';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

export interface TrapHost {
  readonly world: MatchWorld;
  detonate(trap: TrapEntity, attacker: PlayerEntity, weapon: WeaponId): void;
  woundEnemy(trap: TrapEntity, enemy: EnemyEntity, amount: number): void;
  woundPlayer(player: PlayerEntity, amount: number): void;
  disarm(trap: TrapEntity): void;
  spend(trap: TrapEntity): void;
}
