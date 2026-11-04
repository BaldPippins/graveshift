import { SIMULATION } from '@graveshift/shared/config';
import { clamp, directionFromAngle, vec2 } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { motionClearance } from '@graveshift/shared/rules';
import { CollisionLayer, traceRayAgainstMap } from '@graveshift/shared/world';
import type { RayTrace } from '@graveshift/shared/world';
import type { CombatTargets } from '../combat/CombatTargets.ts';
import type { HitApplier } from '../combat/HitApplier.ts';
import { HitKind } from '../combat/HitKind.ts';
import type { HitscanHit } from '../combat/HitscanHit.ts';
import type { HitscanResolver } from '../combat/HitscanResolver.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

const MUZZLE_OFFSET = 0.45;

export class WeaponSystem {
  private readonly world: MatchWorld;
  private readonly hitscan: HitscanResolver;
  private readonly targets: CombatTargets;
  private readonly applier: HitApplier;
  private readonly friendlyFire: boolean;
  private readonly direction = vec2();
  private readonly origin = vec2();
  private readonly trace: RayTrace = { distance: 0, blockedIndex: -1 };

  constructor(
    world: MatchWorld,
    hitscan: HitscanResolver,
    targets: CombatTargets,
    applier: HitApplier,
    friendlyFire: boolean,
  ) {
    this.world = world;
    this.hitscan = hitscan;
    this.targets = targets;
    this.applier = applier;
    this.friendlyFire = friendlyFire;
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
    const wall = traceRayAgainstMap(
      this.world.map,
      this.origin,
      direction,
      range,
      CollisionLayer.Projectiles,
      motionClearance(player.height),
      this.trace,
    );
    const wallDistance = wall.distance;
    const penetrations = 1 + pierce;
    const candidates = this.hitscan
      .resolve(
        { origin: this.origin, direction, maxDistance: wallDistance, viewTick },
        this.targets.ranged(),
        player,
      )
      .slice(0, penetrations);
    const allyIndex = this.friendlyFire
      ? -1
      : candidates.findIndex((hit) => hit.kind === HitKind.Player);
    const hits = allyIndex < 0 ? candidates : candidates.slice(0, allyIndex + 1);
    const obstacle = this.targets.obstacleAt(wall.blockedIndex);
    if (obstacle !== null && allyIndex < 0 && hits.length < penetrations) {
      hits.push({ kind: HitKind.Obstacle, obstacle, distance: wallDistance });
    }
    for (const hit of hits) {
      this.applyHit(hit, damage, player);
    }
    const lastHit = hits.at(-1);
    const travelled =
      lastHit !== undefined && (allyIndex >= 0 || hits.length === penetrations)
        ? lastHit.distance
        : wallDistance;
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
    this.applier.apply(hit, damage, shooter, shooter.arsenal.current);
  }
}
