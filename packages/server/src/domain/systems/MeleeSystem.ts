import { MELEE_RULES, SIMULATION } from '@graveshift/shared/config';
import type { MeleeStats } from '@graveshift/shared/config';
import { clamp } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { criticalMeleeStats, motionClearance } from '@graveshift/shared/rules';
import type { CombatTargets } from '../combat/CombatTargets.ts';
import type { HitApplier } from '../combat/HitApplier.ts';
import { HitKind } from '../combat/HitKind.ts';
import type { HitscanHit } from '../combat/HitscanHit.ts';
import type { MeleeResolver } from '../combat/MeleeResolver.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

function isCreatureHit(hit: HitscanHit): boolean {
  return hit.kind === HitKind.Enemy || hit.kind === HitKind.Player;
}

export class MeleeSystem {
  private readonly world: MatchWorld;
  private readonly resolver: MeleeResolver;
  private readonly targets: CombatTargets;
  private readonly applier: HitApplier;
  private readonly friendlyFire: boolean;

  constructor(
    world: MatchWorld,
    resolver: MeleeResolver,
    targets: CombatTargets,
    applier: HitApplier,
    friendlyFire: boolean,
  ) {
    this.world = world;
    this.resolver = resolver;
    this.targets = targets;
    this.applier = applier;
    this.friendlyFire = friendlyFire;
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
    const swingStats = player.meleeStats;
    const critical = this.world.random.chance(swingStats.critChance);
    const stats = critical ? criticalMeleeStats(swingStats) : swingStats;
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
      this.targets.melee(this.friendlyFire),
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
      critical,
      hits: hits.filter(isCreatureHit).length,
    });
    if (!furious) {
      this.chargeFury(player, kills);
    }
  }

  private applyHit(hit: HitscanHit, stats: MeleeStats, attacker: PlayerEntity): number {
    this.applier.apply(hit, stats.damage, attacker, attacker.arsenal.melee);
    return hit.kind === HitKind.Enemy && hit.enemy.isDead ? 1 : 0;
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
