import type { WeaponId } from '@graveshift/shared/config';
import { GameEventType } from '@graveshift/shared/protocol';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { EconomyService } from './EconomyService.ts';
import type { PickupSpawner } from './PickupSpawner.ts';

export class EnemyDamageService {
  private readonly world: MatchWorld;
  private readonly economy: EconomyService;
  private readonly pickups: PickupSpawner;

  constructor(world: MatchWorld, economy: EconomyService, pickups: PickupSpawner) {
    this.world = world;
    this.economy = economy;
    this.pickups = pickups;
  }

  damage(
    enemy: EnemyEntity,
    rawAmount: number,
    attacker: PlayerEntity | null,
    weapon: WeaponId | null,
  ): void {
    if (enemy.isDead) {
      return;
    }
    const amount = Math.min(enemy.health, rawAmount);
    enemy.health -= amount;
    this.world.events.emit({
      type: GameEventType.EnemyDamaged,
      enemyId: enemy.id,
      attackerId: attacker === null ? null : attacker.id,
      amount,
      x: enemy.position.x,
      y: enemy.position.y,
    });
    if (enemy.health <= 0) {
      this.kill(enemy, attacker, weapon);
    }
  }

  private kill(enemy: EnemyEntity, killer: PlayerEntity | null, weapon: WeaponId | null): void {
    this.world.removeEnemy(enemy);
    this.world.events.emit({
      type: GameEventType.EnemyKilled,
      enemyId: enemy.id,
      kind: enemy.definition.kind,
      killerId: killer === null ? null : killer.id,
      weapon,
      x: enemy.position.x,
      y: enemy.position.y,
    });
    if (killer !== null) {
      this.economy.award(killer, enemy.definition.bounty);
    }
    this.pickups.rollDrops(enemy.position);
  }
}
