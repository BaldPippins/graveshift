import type { WeaponId } from '@graveshift/shared/config';
import { assertNever } from '@graveshift/shared/core';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { EnemyDamageService } from '../services/EnemyDamageService.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import type { TrapService } from '../services/TrapService.ts';
import type { WreckageService } from '../services/WreckageService.ts';
import { HitKind } from './HitKind.ts';
import type { HitscanHit } from './HitscanHit.ts';

export class HitApplier {
  private readonly enemyDamage: EnemyDamageService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly merchants: MerchantService;
  private readonly wreckage: WreckageService;
  private readonly traps: TrapService;
  private readonly friendlyFire: boolean;

  constructor(
    enemyDamage: EnemyDamageService,
    lifecycle: PlayerLifecycle,
    merchants: MerchantService,
    wreckage: WreckageService,
    traps: TrapService,
    friendlyFire: boolean,
  ) {
    this.enemyDamage = enemyDamage;
    this.lifecycle = lifecycle;
    this.merchants = merchants;
    this.wreckage = wreckage;
    this.traps = traps;
    this.friendlyFire = friendlyFire;
  }

  apply(hit: HitscanHit, amount: number, attacker: PlayerEntity, weapon: WeaponId): void {
    switch (hit.kind) {
      case HitKind.Enemy:
        this.enemyDamage.damage(hit.enemy, amount, attacker, weapon);
        return;
      case HitKind.Player:
        if (this.friendlyFire) {
          this.lifecycle.damage(hit.player, amount, attacker.id);
        }
        return;
      case HitKind.Merchant:
        this.merchants.damage(amount, attacker.id);
        return;
      case HitKind.Obstacle:
        this.wreckage.damage(hit.obstacle, amount, attacker.id);
        return;
      case HitKind.Trap:
        this.traps.strike(hit.trap, attacker, weapon);
        return;
      default:
        assertNever(hit);
    }
  }
}
