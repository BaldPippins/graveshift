import { PLAYER_RULES } from '@graveshift/shared/config';
import { PlayerFlag } from '@graveshift/shared/model';
import { ServerMessageType } from '@graveshift/shared/protocol';
import type {
  EnemySnapshot,
  GameEvent,
  MerchantSnapshot,
  PickupSnapshot,
  PlayerSnapshot,
  SnapshotMessage,
} from '@graveshift/shared/protocol';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { PickupEntity } from '../entities/PickupEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { WaveDirector } from '../waves/WaveDirector.ts';
import type { MatchWorld } from './MatchWorld.ts';

function playerFlags(player: PlayerEntity): number {
  let flags = 0;
  if (player.arsenal.isReloading) {
    flags |= PlayerFlag.Reloading;
  }
  if (player.paused) {
    flags |= PlayerFlag.Paused;
  }
  if (!player.connected) {
    flags |= PlayerFlag.Disconnected;
  }
  if (player.triggerHeld) {
    flags |= PlayerFlag.Firing;
  }
  return flags;
}

function snapshotPlayer(player: PlayerEntity): PlayerSnapshot {
  return {
    id: player.id,
    hero: player.hero.id,
    x: player.position.x,
    y: player.position.y,
    aim: player.aim,
    health: player.health,
    maxHealth: player.maxHealth,
    life: player.life,
    weapon: player.arsenal.current,
    ammo: player.arsenal.currentAmmo,
    flags: playerFlags(player),
    reviveProgress: player.reviveProgress,
    bleedoutProgress: player.bleedoutRemainingSeconds / PLAYER_RULES.bleedoutSeconds,
    coins: player.coins,
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
    healthFraction: merchant.health / merchant.maxHealth,
    wavesUntilReturn: merchant.wavesUntilReturn,
  };
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
    events,
  };
}
