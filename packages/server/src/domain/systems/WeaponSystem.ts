import { SIMULATION } from '@graveshift/shared/config';
import { assertNever, clamp, directionFromAngle, vec2 } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { motionClearance } from '@graveshift/shared/rules';
import { castRayAgainstMap, CollisionLayer } from '@graveshift/shared/world';
import { HitKind } from '../combat/HitKind.ts';
import type { HitscanHit } from '../combat/HitscanHit.ts';
import type { HitscanResolver } from '../combat/HitscanResolver.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { EnemyDamageService } from '../services/EnemyDamageService.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';

const MUZZLE_OFFSET = 0.45;

export class WeaponSystem {
  private readonly world: MatchWorld;
  private readonly hitscan: HitscanResolver;
  private readonly enemyDamage: EnemyDamageService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly merchants: MerchantService;
  private readonly direction = vec2();
  private readonly origin = vec2();

  constructor(
    world: MatchWorld,
    hitscan: HitscanResolver,
    enemyDamage: EnemyDamageService,
    lifecycle: PlayerLifecycle,
    merchants: MerchantService,
  ) {
    this.world = world;
    this.hitscan = hitscan;
    this.enemyDamage = enemyDamage;
    this.lifecycle = lifecycle;
    this.merchants = merchants;
  }

  update(): void {
    for (const player of this.world.players.values()) {
      const canFire = player.isAlive && !player.isIdle && player.triggerHeld;
      player.arsenal.advance(SIMULATION.tickSeconds, canFire);
      if (!canFire) {
        continue;
      }
      while (player.arsenal.consumeShot()) {
        this.fireVolley(player);
      }
    }
  }

  private fireVolley(player: PlayerEntity): void {
    const stats = player.arsenal.currentStats;
    const viewTick = clamp(
      player.viewTick,
      this.world.tick - SIMULATION.maxRewindTicks,
      this.world.tick,
    );
    for (let pellet = 0; pellet < stats.pellets; pellet += 1) {
      const spread = this.world.random.range(-stats.spreadRadians / 2, stats.spreadRadians / 2);
      this.firePellet(
        player,
        player.aim + spread,
        stats.range,
        stats.damage,
        stats.pierce,
        viewTick,
      );
    }
  }

  private firePellet(
    player: PlayerEntity,
    angle: number,
    range: number,
    damage: number,
    pierce: number,
    viewTick: number,
  ): void {
    const direction = directionFromAngle(angle, this.direction);
    this.origin.x = player.position.x + direction.x * MUZZLE_OFFSET;
    this.origin.y = player.position.y + direction.y * MUZZLE_OFFSET;
    const wallDistance = castRayAgainstMap(
      this.world.map,
      this.origin,
      direction,
      range,
      CollisionLayer.Projectiles,
      motionClearance(player.height),
    );
    const penetrations = 1 + pierce;
    const hits = this.hitscan
      .resolve(
        { origin: this.origin, direction, maxDistance: wallDistance, viewTick },
        this.world.enemies.values(),
        this.world.players.values(),
        this.merchants.aliveMerchant,
        player,
      )
      .slice(0, penetrations);
    for (const hit of hits) {
      this.applyHit(hit, damage, player);
    }
    const lastHit = hits.at(-1);
    const travelled =
      lastHit !== undefined && hits.length === penetrations ? lastHit.distance : wallDistance;
    this.world.events.emit({
      type: GameEventType.ShotFired,
      shooterId: player.id,
      weapon: player.arsenal.current,
      fromX: this.origin.x,
      fromY: this.origin.y,
      toX: this.origin.x + direction.x * travelled,
      toY: this.origin.y + direction.y * travelled,
      hit: hits.some((hit) => hit.kind === HitKind.Enemy),
    });
  }

  private applyHit(hit: HitscanHit, damage: number, shooter: PlayerEntity): void {
    switch (hit.kind) {
      case HitKind.Enemy:
        this.enemyDamage.damage(hit.enemy, damage, shooter, shooter.arsenal.current);
        return;
      case HitKind.Player:
        this.lifecycle.damage(hit.player, damage, shooter.id);
        return;
      case HitKind.Merchant:
        this.merchants.damage(damage, shooter.id);
        return;
      default:
        assertNever(hit);
    }
  }
}
