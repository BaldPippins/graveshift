import { directionTo, distance, vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { isInsideMeleeSweep } from '@graveshift/shared/rules';
import { CollisionLayer, hasLineOfSight, traceRayAgainstMap } from '@graveshift/shared/world';
import type { RayTrace, TileMap } from '@graveshift/shared/world';
import type { Body } from '../entities/Body.ts';
import type { DestructibleCell } from '../entities/DestructibleCell.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import { HitKind } from './HitKind.ts';
import type { HitscanHit } from './HitscanHit.ts';
import type { MeleeTargets } from './HitTargets.ts';
import type { MeleeArc } from './MeleeArc.ts';
import type { PositionHistory } from './PositionHistory.ts';

const OBSTACLE_RADIUS = 0.5;

export class MeleeResolver {
  private readonly history: PositionHistory;
  private readonly map: TileMap;
  private readonly scratch = vec2();
  private readonly direction = vec2();
  private readonly trace: RayTrace = { distance: 0, blockedIndex: -1 };

  constructor(history: PositionHistory, map: TileMap) {
    this.history = history;
    this.map = map;
  }

  resolve(arc: MeleeArc, targets: MeleeTargets, attacker: PlayerEntity): HitscanHit[] {
    const hits: HitscanHit[] = [];
    for (const enemy of targets.enemies) {
      if (enemy.definition.airborne) {
        continue;
      }
      const reach = this.reachOf(arc, enemy);
      if (reach !== null) {
        hits.push({ kind: HitKind.Enemy, enemy, distance: reach });
      }
    }
    for (const player of targets.players) {
      if (player === attacker || !player.isAlive) {
        continue;
      }
      const reach = this.reachOf(arc, player);
      if (reach !== null) {
        hits.push({ kind: HitKind.Player, player, distance: reach });
      }
    }
    const merchant = targets.merchant;
    const merchantReach = merchant === null ? null : this.reachOf(arc, merchant);
    if (merchant !== null && merchantReach !== null) {
      hits.push({ kind: HitKind.Merchant, merchant, distance: merchantReach });
    }
    for (const trap of targets.traps) {
      const reach = this.reachOf(arc, trap);
      if (reach !== null) {
        hits.push({ kind: HitKind.Trap, trap, distance: reach });
      }
    }
    for (const obstacle of targets.obstacles) {
      const reach = this.obstacleReach(arc, obstacle);
      if (reach !== null) {
        hits.push({ kind: HitKind.Obstacle, obstacle, distance: reach });
      }
    }
    return hits.sort((left, right) => left.distance - right.distance);
  }

  private reachOf(arc: MeleeArc, body: Body): number | null {
    const position = this.history.resolve(body, arc.viewTick, this.scratch);
    if (!isInsideMeleeSweep(arc, position, body.radius)) {
      return null;
    }
    const visible = hasLineOfSight(
      this.map,
      arc.origin,
      position,
      CollisionLayer.Projectiles,
      arc.clearance,
    );
    return visible ? distance(arc.origin, position) : null;
  }

  private obstacleReach(arc: MeleeArc, obstacle: DestructibleCell): number | null {
    if (!isInsideMeleeSweep(arc, obstacle.center, OBSTACLE_RADIUS)) {
      return null;
    }
    return this.firstBlockedIs(arc, obstacle.center, obstacle.index) ? this.trace.distance : null;
  }

  private firstBlockedIs(arc: MeleeArc, target: ReadonlyVec2, index: number): boolean {
    const length = directionTo(arc.origin, target, this.direction);
    traceRayAgainstMap(
      this.map,
      arc.origin,
      this.direction,
      length,
      CollisionLayer.Projectiles,
      arc.clearance,
      this.trace,
    );
    return this.trace.blockedIndex === index;
  }
}
