import { MELEE_RULES, PLAYER_RULES } from '@graveshift/shared/config';
import { flagSetOf } from '@graveshift/shared/core';
import { upgradeGrade } from '@graveshift/shared/rules';
import { PLAYER_FLAGS, PlayerFlag, TrapState } from '@graveshift/shared/model';
import type { PlayerFlags } from '@graveshift/shared/model';
import { ServerMessageType } from '@graveshift/shared/protocol';
import type {
  EnemySnapshot,
  GameEvent,
  MerchantSnapshot,
  ObstacleSnapshot,
  PickupSnapshot,
  PlayerSnapshot,
  SnapshotMessage,
  TrapSnapshot,
} from '@graveshift/shared/protocol';
import type { DestructibleCell } from '../entities/DestructibleCell.ts';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PickupEntity } from '../entities/PickupEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';
import type { WaveDirector } from '../waves/WaveDirector.ts';
import type { MatchWorld } from './MatchWorld.ts';

const PLAYER_FLAG_CHECKS: Readonly<Record<PlayerFlag, (player: PlayerEntity) => boolean>> = {
  [PlayerFlag.Reloading]: (player) => player.arsenal.isReloading,
  [PlayerFlag.Paused]: (player) => player.paused,
  [PlayerFlag.Firing]: (player) => player.triggerHeld,
  [PlayerFlag.Disconnected]: (player) => !player.connected,
  [PlayerFlag.Snared]: (player) => player.snared,
};

function playerFlags(player: PlayerEntity): PlayerFlags {
  return flagSetOf(PLAYER_FLAGS.filter((flag) => PLAYER_FLAG_CHECKS[flag](player)));
}

function snapshotPlayer(player: PlayerEntity): PlayerSnapshot {
  return {
    id: player.id,
    hero: player.hero.id,
    x: player.position.x,
    y: player.position.y,
    height: player.height,
    verticalSpeed: player.verticalSpeed,
    aim: player.aim,
    health: player.health,
    maxHealth: player.maxHealth,
    life: player.life,
    weapon: player.arsenal.current,
    ammo: player.arsenal.currentAmmo,
    weaponGrade: upgradeGrade(player.arsenal.loadout.upgrades[player.arsenal.current]),
    melee: player.arsenal.melee,
    meleeGrade: upgradeGrade(player.arsenal.loadout.upgrades[player.arsenal.melee]),
    meleeCharge: player.meleeCharge,
    furyProgress: player.furySecondsLeft / MELEE_RULES.furySeconds,
    flags: playerFlags(player),
    reloadProgress: player.arsenal.reloadProgress,
    reviveProgress: player.reviveProgress,
    bleedoutProgress: player.bleedoutRemainingSeconds / PLAYER_RULES.bleedoutSeconds,
    coins: player.coins,
    pingMilliseconds: player.pingMilliseconds,
    lastInputSequence: player.lastInputSequence,
  };
}

function snapshotEnemy(enemy: EnemyEntity): EnemySnapshot {
  return {
    id: enemy.id,
    kind: enemy.definition.kind,
    x: enemy.position.x,
    y: enemy.position.y,
    facing: enemy.facing,
    healthFraction: enemy.health / enemy.maxHealth,
    action: enemy.action,
  };
}

function snapshotMerchant(merchant: MerchantEntity): MerchantSnapshot {
  return {
    x: merchant.position.x,
    y: merchant.position.y,
    healthFraction: merchant.health / merchant.maxHealth,
    wavesUntilReturn: merchant.wavesUntilReturn,
  };
}

function snapshotObstacle(obstacle: DestructibleCell): ObstacleSnapshot {
  return {
    cell: obstacle.index,
    healthFraction: obstacle.health / obstacle.maxHealth,
    wrecked: obstacle.isWrecked,
  };
}

function snapshotTrap(trap: TrapEntity): TrapSnapshot {
  return { cell: trap.spot.index, state: trap.behavior.state };
}

function snapshotSpentTrap(cell: number): TrapSnapshot {
  return { cell, state: TrapState.Spent };
}

export interface SnapshotScenery {
  readonly obstacles: readonly DestructibleCell[];
  readonly traps: readonly TrapEntity[];
  readonly spentTraps: readonly number[];
}

function snapshotPickup(pickup: PickupEntity): PickupSnapshot {
  return {
    id: pickup.id,
    kind: pickup.definition.kind,
    x: pickup.position.x,
    y: pickup.position.y,
  };
}

export function buildSnapshot(
  world: MatchWorld,
  director: WaveDirector,
  scenery: SnapshotScenery,
  events: readonly GameEvent[],
): SnapshotMessage {
  return {
    type: ServerMessageType.Snapshot,
    tick: world.tick,
    phase: director.phase,
    wave: director.wave,
    phaseTicksLeft: director.phaseTicksLeft,
    enemiesRemaining: director.enemiesRemaining,
    players: [...world.players.values()].map(snapshotPlayer),
    enemies: [...world.enemies.values()].map(snapshotEnemy),
    pickups: [...world.pickups.values()].map(snapshotPickup),
    merchant: world.merchant === null ? null : snapshotMerchant(world.merchant),
    obstacles: scenery.obstacles.map(snapshotObstacle),
    traps: [...scenery.traps.map(snapshotTrap), ...scenery.spentTraps.map(snapshotSpentTrap)],
    events,
  };
}
