import { vec2, wrapAngle } from '@graveshift/shared/core';
import { CollisionLayer, hasLineOfSight } from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import type { Body } from '../entities/Body.ts';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import { HitKind } from './HitKind.ts';
import type { HitscanHit } from './HitscanHit.ts';
import type { MeleeArc } from './MeleeArc.ts';
import type { PositionHistory } from './PositionHistory.ts';

const FULL_CIRCLE = Math.PI * 2;

export class MeleeResolver {
  private readonly history: PositionHistory;
  private readonly map: TileMap;
  private readonly scratch = vec2();

  constructor(history: PositionHistory, map: TileMap) {
    this.history = history;
    this.map = map;
  }

  resolve(
    arc: MeleeArc,
    enemies: Iterable<EnemyEntity>,
    players: Iterable<PlayerEntity>,
    merchant: MerchantEntity | null,
    attacker: PlayerEntity,
  ): HitscanHit[] {
    const hits: HitscanHit[] = [];
    for (const enemy of enemies) {
      const distance = this.reachOf(arc, enemy);
      if (distance !== null) {
        hits.push({ kind: HitKind.Enemy, enemy, distance });
      }
    }
    for (const player of players) {
      if (player === attacker || !player.isAlive) {
        continue;
      }
      const distance = this.reachOf(arc, player);
      if (distance !== null) {
        hits.push({ kind: HitKind.Player, player, distance });
      }
    }
    const merchantDistance = merchant === null ? null : this.reachOf(arc, merchant);
    if (merchant !== null && merchantDistance !== null) {
      hits.push({ kind: HitKind.Merchant, merchant, distance: merchantDistance });
    }
    return hits.sort((left, right) => left.distance - right.distance);
  }

  private reachOf(arc: MeleeArc, body: Body): number | null {
    const position = this.history.resolve(body, arc.viewTick, this.scratch);
    const dx = position.x - arc.origin.x;
    const dy = position.y - arc.origin.y;
    const distance = Math.hypot(dx, dy);
    if (distance > arc.reach + body.radius) {
      return null;
    }
    if (distance > body.radius && !this.isWithinSweep(arc, dx, dy, distance, body.radius)) {
      return null;
    }
    const visible = hasLineOfSight(
      this.map,
      arc.origin,
      position,
      CollisionLayer.Projectiles,
      arc.clearance,
    );
    return visible ? distance : null;
  }

  private isWithinSweep(
    arc: MeleeArc,
    dx: number,
    dy: number,
    distance: number,
    radius: number,
  ): boolean {
    if (arc.arcRadians >= FULL_CIRCLE) {
      return true;
    }
    const offset = Math.abs(wrapAngle(Math.atan2(dy, dx) - arc.aim));
    return offset <= arc.arcRadians / 2 + Math.asin(Math.min(1, radius / distance));
  }
}
