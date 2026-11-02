import { fractionOf, lerpAngle, lerpPoint } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import type { EnemySnapshot, PickupSnapshot, PlayerSnapshot } from '@graveshift/shared/protocol';
import type { SnapshotBracket } from '../sync/SnapshotBracket.ts';
import type { Identified } from './Identified.ts';
import type { EnemyFrame, PickupFrame, PlayerFrame, WorldFrame } from './WorldFrame.ts';

const MOVING_EPSILON = 0.002;

export interface LocalPlayerOverride {
  readonly id: number;
  readonly position: ReadonlyVec2;
  readonly aim: number;
  readonly moving: boolean;
}

function indexById<T extends Identified>(items: readonly T[]): Map<number, T> {
  return new Map(items.map((item) => [item.id, item]));
}

function isMoving(from: ReadonlyVec2, to: ReadonlyVec2): boolean {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y) > MOVING_EPSILON;
}

function interpolatePlayer(
  older: PlayerSnapshot | undefined,
  newer: PlayerSnapshot,
  alpha: number,
  nickname: string,
  local: LocalPlayerOverride | null,
): PlayerFrame {
  const from = older ?? newer;
  const base = {
    id: newer.id,
    hero: newer.hero,
    nickname,
    life: newer.life,
    weapon: newer.weapon,
    flags: newer.flags,
    reviveProgress: newer.reviveProgress,
    healthFraction: fractionOf(newer.health, newer.maxHealth),
  };
  if (local !== null && local.id === newer.id) {
    return {
      ...base,
      x: local.position.x,
      y: local.position.y,
      aim: local.aim,
      moving: local.moving,
      isLocal: true,
    };
  }
  return {
    ...base,
    ...lerpPoint(from, newer, alpha),
    aim: lerpAngle(from.aim, newer.aim, alpha),
    moving: isMoving(from, newer),
    isLocal: false,
  };
}

function interpolateEnemy(
  older: EnemySnapshot | undefined,
  newer: EnemySnapshot,
  alpha: number,
): EnemyFrame {
  const from = older ?? newer;
  return {
    id: newer.id,
    kind: newer.kind,
    ...lerpPoint(from, newer, alpha),
    facing: lerpAngle(from.facing, newer.facing, alpha),
    action: newer.action,
    healthFraction: newer.healthFraction,
    moving: isMoving(from, newer),
  };
}

function interpolatePickup(
  older: PickupSnapshot | undefined,
  newer: PickupSnapshot,
  alpha: number,
): PickupFrame {
  const from = older ?? newer;
  return {
    id: newer.id,
    kind: newer.kind,
    ...lerpPoint(from, newer, alpha),
  };
}

export function interpolateWorld(
  bracket: SnapshotBracket,
  nicknames: ReadonlyMap<number, string>,
  local: LocalPlayerOverride | null,
): WorldFrame {
  const olderPlayers = indexById(bracket.older.players);
  const olderEnemies = indexById(bracket.older.enemies);
  const olderPickups = indexById(bracket.older.pickups);
  return {
    players: bracket.newer.players.map((player) =>
      interpolatePlayer(
        olderPlayers.get(player.id),
        player,
        bracket.alpha,
        nicknames.get(player.id) ?? '',
        local,
      ),
    ),
    enemies: bracket.newer.enemies.map((enemy) =>
      interpolateEnemy(olderEnemies.get(enemy.id), enemy, bracket.alpha),
    ),
    pickups: bracket.newer.pickups.map((pickup) =>
      interpolatePickup(olderPickups.get(pickup.id), pickup, bracket.alpha),
    ),
    merchant: bracket.newer.merchant,
  };
}
