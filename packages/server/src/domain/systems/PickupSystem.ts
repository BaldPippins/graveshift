import { PICKUP_RULES, PickupEffect, SIMULATION } from '@graveshift/shared/config';
import {
  assertNever,
  directionTo,
  distanceSquared,
  nearestTo,
  vec2,
} from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { PickupEntity } from '../entities/PickupEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { EconomyService } from '../services/EconomyService.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';

export class PickupSystem {
  private readonly world: MatchWorld;
  private readonly economy: EconomyService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly pull = vec2();

  constructor(world: MatchWorld, economy: EconomyService, lifecycle: PlayerLifecycle) {
    this.world = world;
    this.economy = economy;
    this.lifecycle = lifecycle;
  }

  update(): void {
    for (const pickup of [...this.world.pickups.values()]) {
      pickup.remainingSeconds -= SIMULATION.tickSeconds;
      if (pickup.remainingSeconds <= 0) {
        this.world.removePickup(pickup);
        continue;
      }
      if (pickup.definition.effect === PickupEffect.Coins) {
        this.attract(pickup);
      }
      const collector = this.findCollector(pickup);
      if (collector !== undefined) {
        this.collect(pickup, collector);
      }
    }
  }

  private attract(pickup: PickupEntity): void {
    const magnet = nearestTo(
      pickup.position,
      this.world.players.values(),
      (player) => player.position,
      {
        maxDistance: PICKUP_RULES.coinMagnetRadius,
        accept: (player) => player.isAlive,
      },
    );
    if (magnet === null) {
      return;
    }
    const distance = directionTo(pickup.position, magnet.position, this.pull);
    const step = Math.min(distance, PICKUP_RULES.coinMagnetSpeed * SIMULATION.tickSeconds);
    pickup.position.x += this.pull.x * step;
    pickup.position.y += this.pull.y * step;
  }

  private findCollector(pickup: PickupEntity): PlayerEntity | undefined {
    const radiusSquared = PICKUP_RULES.collectRadius * PICKUP_RULES.collectRadius;
    for (const player of this.world.players.values()) {
      if (!player.isAlive || distanceSquared(player.position, pickup.position) > radiusSquared) {
        continue;
      }
      if (pickup.definition.effect === PickupEffect.Heal && player.health >= player.maxHealth) {
        continue;
      }
      return player;
    }
    return undefined;
  }

  private collect(pickup: PickupEntity, player: PlayerEntity): void {
    const { kind, effect, amount } = pickup.definition;
    switch (effect) {
      case PickupEffect.Coins:
        this.economy.award(player, amount);
        break;
      case PickupEffect.Heal:
        this.lifecycle.heal(player, amount);
        break;
      default:
        assertNever(effect);
    }
    this.world.removePickup(pickup);
    this.world.events.emit({
      type: GameEventType.PickupCollected,
      playerId: player.id,
      kind,
      amount,
    });
  }
}
