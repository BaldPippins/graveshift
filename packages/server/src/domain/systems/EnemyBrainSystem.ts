import { MERCHANT_RULES, SIMULATION } from '@graveshift/shared/config';
import {
  angleBetween,
  directionTo,
  distanceSquared,
  lerpAngle,
  nearestTo,
  vec2,
} from '@graveshift/shared/core';
import type { Vec2 } from '@graveshift/shared/core';
import { EnemyAction } from '@graveshift/shared/model';
import {
  cellAt,
  clampInsideMap,
  CollisionLayer,
  FlowField,
  hasLineOfSight,
  moveCircle,
} from '@graveshift/shared/world';
import { SpatialHashGrid } from '../ai/SpatialHashGrid.ts';
import type { Body } from '../entities/Body.ts';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';

const ATTACK_WINDUP_FRACTION = 0.45;
const DIRECT_CHASE_RANGE = 10;
const SEPARATION_RADIUS = 1.1;
const SEPARATION_STRENGTH = 2.4;
const FACING_SHARPNESS = 0.35;

export class EnemyBrainSystem {
  private readonly world: MatchWorld;
  private readonly lifecycle: PlayerLifecycle;
  private readonly merchants: MerchantService;
  private readonly flowField: FlowField;
  private readonly grid = new SpatialHashGrid<EnemyEntity>(1);
  private readonly desired = vec2();
  private readonly separation = vec2();
  private ticksUntilFlowRefresh = 0;

  constructor(world: MatchWorld, lifecycle: PlayerLifecycle, merchants: MerchantService) {
    this.world = world;
    this.lifecycle = lifecycle;
    this.merchants = merchants;
    this.flowField = new FlowField(world.map);
  }

  update(): void {
    const targets = this.world.alivePlayers();
    if (targets.length === 0) {
      for (const enemy of this.world.enemies.values()) {
        enemy.action = EnemyAction.Moving;
      }
      return;
    }
    this.refreshFlowField(targets);
    this.grid.clear();
    for (const enemy of this.world.enemies.values()) {
      this.grid.insert(enemy, enemy.position);
    }
    for (const enemy of this.world.enemies.values()) {
      this.think(enemy, targets);
    }
  }

  private refreshFlowField(targets: readonly PlayerEntity[]): void {
    this.ticksUntilFlowRefresh -= 1;
    if (this.ticksUntilFlowRefresh > 0) {
      return;
    }
    this.ticksUntilFlowRefresh = SIMULATION.flowFieldRefreshTicks;
    this.flowField.rebuild(targets.map((player) => cellAt(player.position)));
  }

  private think(enemy: EnemyEntity, targets: readonly PlayerEntity[]): void {
    const target = this.chooseTarget(enemy, this.nearestTarget(enemy.position, targets));
    const reach = enemy.definition.radius + target.radius + enemy.definition.attackReach;
    if (distanceSquared(enemy.position, target.position) <= reach * reach) {
      this.attack(enemy, target);
      return;
    }
    enemy.action = EnemyAction.Moving;
    this.chooseDirection(enemy, target, this.desired);
    this.computeSeparation(enemy, this.separation);
    const speed = enemy.definition.moveSpeed;
    const velocityX = this.desired.x * speed + this.separation.x * SEPARATION_STRENGTH;
    const velocityY = this.desired.y * speed + this.separation.y * SEPARATION_STRENGTH;
    this.move(enemy, velocityX * SIMULATION.tickSeconds, velocityY * SIMULATION.tickSeconds);
    if (velocityX !== 0 || velocityY !== 0) {
      enemy.facing = lerpAngle(enemy.facing, Math.atan2(velocityY, velocityX), FACING_SHARPNESS);
    }
  }

  private chooseTarget(enemy: EnemyEntity, player: PlayerEntity): PlayerEntity | MerchantEntity {
    const merchant = this.merchants.aliveMerchant;
    if (merchant === null) {
      return player;
    }
    const playerClose =
      distanceSquared(enemy.position, player.position) <= MERCHANT_RULES.playerPriorityRadius ** 2;
    const merchantClose =
      distanceSquared(enemy.position, merchant.position) <= MERCHANT_RULES.enemyAggroRadius ** 2;
    return merchantClose && !playerClose ? merchant : player;
  }

  private attack(enemy: EnemyEntity, target: PlayerEntity | MerchantEntity): void {
    if (enemy.action !== EnemyAction.Attacking) {
      enemy.action = EnemyAction.Attacking;
      enemy.attackCooldownSeconds = enemy.definition.attackIntervalSeconds * ATTACK_WINDUP_FRACTION;
    }
    enemy.facing = angleBetween(enemy.position, target.position);
    enemy.attackCooldownSeconds -= SIMULATION.tickSeconds;
    if (enemy.attackCooldownSeconds <= 0) {
      this.strike(target, enemy.definition.attackDamage);
      enemy.attackCooldownSeconds += enemy.definition.attackIntervalSeconds;
    }
  }

  private strike(target: PlayerEntity | MerchantEntity, damage: number): void {
    if (target instanceof MerchantEntity) {
      this.merchants.damage(damage, null);
    } else {
      this.lifecycle.damage(target, damage, null);
    }
  }

  private chooseDirection(enemy: EnemyEntity, target: Body, out: Vec2): void {
    const directChase =
      enemy.definition.phasesThroughWalls ||
      (distanceSquared(enemy.position, target.position) < DIRECT_CHASE_RANGE * DIRECT_CHASE_RANGE &&
        hasLineOfSight(this.world.map, enemy.position, target.position, CollisionLayer.Movement));
    if (!directChase && this.flowField.directionAt(enemy.position, out)) {
      return;
    }
    directionTo(enemy.position, target.position, out);
  }

  private computeSeparation(enemy: EnemyEntity, out: Vec2): void {
    out.x = 0;
    out.y = 0;
    this.grid.forEachNear(enemy.position, SEPARATION_RADIUS, (other) => {
      if (other === enemy) {
        return;
      }
      const dx = enemy.position.x - other.position.x;
      const dy = enemy.position.y - other.position.y;
      const distance = Math.hypot(dx, dy);
      const minimum = enemy.definition.radius + other.definition.radius;
      if (distance >= minimum || distance < 1e-6) {
        return;
      }
      const overlap = (minimum - distance) / minimum;
      out.x += (dx / distance) * overlap;
      out.y += (dy / distance) * overlap;
    });
  }

  private move(enemy: EnemyEntity, deltaX: number, deltaY: number): void {
    if (enemy.definition.phasesThroughWalls) {
      enemy.position.x += deltaX;
      enemy.position.y += deltaY;
      clampInsideMap(enemy.position, enemy.definition.radius, this.world.map);
      return;
    }
    moveCircle(
      enemy.position,
      deltaX,
      deltaY,
      enemy.definition.radius,
      this.world.map,
      CollisionLayer.Movement,
    );
  }

  private nearestTarget(position: Vec2, targets: readonly PlayerEntity[]): PlayerEntity {
    const target = nearestTo(position, targets, (player) => player.position);
    if (target === null) {
      throw new Error('A target is required');
    }
    return target;
  }
}
