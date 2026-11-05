import type { WeaponId } from '@graveshift/shared/config';
import type { TrapState } from '@graveshift/shared/model';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';

export interface TrapBehavior {
  readonly state: TrapState;
  struck(trap: TrapEntity, attacker: PlayerEntity, weapon: WeaponId): void;
  update(trap: TrapEntity): void;
}
