import { distance, vec2 } from '@graveshift/shared/core';
import { isInsideMeleeSweep } from '@graveshift/shared/rules';
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
}
