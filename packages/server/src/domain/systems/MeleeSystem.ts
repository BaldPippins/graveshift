import { MELEE_RULES, SIMULATION } from '@graveshift/shared/config';
import type { MeleeStats } from '@graveshift/shared/config';
import { assertNever, clamp } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { furiousMeleeStats, motionClearance } from '@graveshift/shared/rules';
import { HitKind } from '../combat/HitKind.ts';
import type { HitscanHit } from '../combat/HitscanHit.ts';
import type { MeleeResolver } from '../combat/MeleeResolver.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { EnemyDamageService } from '../services/EnemyDamageService.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';

export class MeleeSystem {
  private readonly world: MatchWorld;
  private readonly resolver: MeleeResolver;
  private readonly enemyDamage: EnemyDamageService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly merchants: MerchantService;

  constructor(
    world: MatchWorld,
    resolver: MeleeResolver,
    enemyDamage: EnemyDamageService,
    lifecycle: PlayerLifecycle,
    merchants: MerchantService,
  ) {
    this.world = world;
    this.resolver = resolver;
    this.enemyDamage = enemyDamage;
    this.lifecycle = lifecycle;
    this.merchants = merchants;
  }

  update(): void {
    for (const player of this.world.players.values()) {
      player.furySecondsLeft = Math.max(0, player.furySecondsLeft - SIMULATION.tickSeconds);
      const canSwing = player.isAlive && !player.isIdle && player.swingHeld;
      player.arsenal.advanceMelee(SIMULATION.tickSeconds, canSwing);
      if (canSwing && player.arsenal.consumeSwing()) {
        this.swing(player);
      }
    }
  }

  private swing(player: PlayerEntity): void {
    const furious = player.isFurious;
    const baseStats = player.arsenal.meleeStats;
    const stats = furious ? furiousMeleeStats(baseStats) : baseStats;
    const hits = this.resolver.resolve(
      {
        origin: player.position,
        aim: player.aim,
        reach: stats.reach,
        arcRadians: stats.arcRadians,
        clearance: motionClearance(player.height),
        viewTick: clamp(
          player.viewTick,
          this.world.tick - SIMULATION.maxRewindTicks,
          this.world.tick,
        ),
      },
      this.world.enemies.values(),
      this.world.players.values(),
      this.merchants.aliveMerchant,
      player,
    );
    const kills = hits.reduce((count, hit) => count + this.applyHit(hit, stats, player), 0);
    this.world.events.emit({
      type: GameEventType.MeleeSwung,
      attackerId: player.id,
      weapon: player.arsenal.melee,
      x: player.position.x,
      y: player.position.y,
      aim: player.aim,
      reach: stats.reach,
      arcRadians: stats.arcRadians,
      furious,
      hits: hits.length,
    });
    if (!furious) {
      this.chargeFury(player, kills);
    }
  }

  private applyHit(hit: HitscanHit, stats: MeleeStats, attacker: PlayerEntity): number {
    switch (hit.kind) {
      case HitKind.Enemy:
        this.enemyDamage.damage(hit.enemy, stats.damage, attacker, attacker.arsenal.melee);
        return hit.enemy.isDead ? 1 : 0;
      case HitKind.Player:
        this.lifecycle.damage(hit.player, stats.damage, attacker.id);
        return 0;
      case HitKind.Merchant:
        this.merchants.damage(stats.damage, attacker.id);
        return 0;
      default:
        return assertNever(hit);
    }
  }

  private chargeFury(player: PlayerEntity, kills: number): void {
    player.meleeCharge += kills;
    if (player.meleeCharge < MELEE_RULES.killsForFury) {
      return;
    }
    player.meleeCharge = 0;
    player.furySecondsLeft = MELEE_RULES.furySeconds;
    this.world.events.emit({ type: GameEventType.FuryUnleashed, playerId: player.id });
  }
}
