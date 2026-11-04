import type { WeaponId } from '@graveshift/shared/config';
import { TrapState } from '@graveshift/shared/model';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';
import type { TrapBehavior } from './TrapBehavior.ts';
import type { TrapHost } from './TrapHost.ts';

export class PowderKegBehavior implements TrapBehavior {
  readonly state = TrapState.Armed;
  private readonly host: TrapHost;

  constructor(host: TrapHost) {
    this.host = host;
  }

  struck(trap: TrapEntity, attacker: PlayerEntity, weapon: WeaponId): void {
    this.host.detonate(trap, attacker, weapon);
  }

  update(): void {
    return;
  }
}
