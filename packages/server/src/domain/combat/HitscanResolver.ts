import { vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { rayCircleIntersection } from '@graveshift/shared/world';
import type { Body } from '../entities/Body.ts';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import { HitKind } from './HitKind.ts';
import type { HitscanHit } from './HitscanHit.ts';
import type { PositionHistory } from './PositionHistory.ts';

export interface HitscanRay {
  readonly origin: ReadonlyVec2;
  readonly direction: ReadonlyVec2;
  readonly maxDistance: number;
  readonly viewTick: number;
}

export class HitscanResolver {
  private readonly history: PositionHistory;
  private readonly scratch = vec2();

  constructor(history: PositionHistory) {
    this.history = history;
  }

  resolve(
    ray: HitscanRay,
    enemies: Iterable<EnemyEntity>,
    players: Iterable<PlayerEntity>,
    merchant: MerchantEntity | null,
    shooter: PlayerEntity,
  ): HitscanHit[] {
    const hits: HitscanHit[] = [];
    for (const enemy of enemies) {
      const distance = this.intersect(ray, enemy);
      if (distance !== null) {
        hits.push({ kind: HitKind.Enemy, enemy, distance });
      }
    }
    for (const player of players) {
      if (player === shooter || !player.isAlive) {
        continue;
      }
      const distance = this.intersect(ray, player);
      if (distance !== null) {
        hits.push({ kind: HitKind.Player, player, distance });
      }
    }
    const merchantDistance = merchant === null ? null : this.intersect(ray, merchant);
    if (merchant !== null && merchantDistance !== null) {
      hits.push({ kind: HitKind.Merchant, merchant, distance: merchantDistance });
    }
    return hits.sort((left, right) => left.distance - right.distance);
  }

  private intersect(ray: HitscanRay, body: Body): number | null {
    const position = this.history.resolve(body, ray.viewTick, this.scratch);
    const distance = rayCircleIntersection(ray.origin, ray.direction, position, body.radius);
    return distance !== null && distance <= ray.maxDistance ? distance : null;
  }
}
