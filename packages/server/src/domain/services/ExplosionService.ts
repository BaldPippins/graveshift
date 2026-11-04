import { BLAST_SURVIVOR_HEALTH } from '@graveshift/shared/config';
import type { BlastSpec, WeaponId } from '@graveshift/shared/config';
import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import type { Body } from '../entities/Body.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { BlastChain } from './BlastChain.ts';
import type { EnemyDamageService } from './EnemyDamageService.ts';
import type { PlayerLifecycle } from './PlayerLifecycle.ts';
import type { WreckageService } from './WreckageService.ts';

function isCaught(body: Body, center: ReadonlyVec2, radius: number): boolean {
  return distanceSquared(body.position, center) <= (radius + body.radius) ** 2;
}

export class ExplosionService {
  private readonly world: MatchWorld;
  private readonly enemyDamage: EnemyDamageService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly wreckage: WreckageService;
  private readonly friendlyFire: boolean;

  constructor(
    world: MatchWorld,
    enemyDamage: EnemyDamageService,
    lifecycle: PlayerLifecycle,
    wreckage: WreckageService,
    friendlyFire: boolean,
  ) {
    this.world = world;
    this.enemyDamage = enemyDamage;
    this.lifecycle = lifecycle;
    this.wreckage = wreckage;
    this.friendlyFire = friendlyFire;
  }

  blast(
    center: ReadonlyVec2,
    spec: BlastSpec,
    attacker: PlayerEntity,
    weapon: WeaponId,
    chain: BlastChain,
  ): void {
    for (const enemy of [...this.world.enemies.values()]) {
      if (isCaught(enemy, center, spec.radius)) {
        this.enemyDamage.damage(enemy, spec.enemyDamage, attacker, weapon);
      }
    }
    if (this.friendlyFire) {
      this.blastPlayers(center, spec, attacker, chain);
    }
    this.wreckage.blast(center, spec.radius, spec.obstacleDamage, attacker.id);
  }

  private blastPlayers(
    center: ReadonlyVec2,
    spec: BlastSpec,
    attacker: PlayerEntity,
    chain: BlastChain,
  ): void {
    const caught = [...this.world.players.values()].filter(
      (player) => player.isAlive && isCaught(player, center, spec.radius),
    );
    chain.survivor ??= this.survivorAmong(caught, spec.playerDamage);
    for (const player of caught) {
      const kept = player === chain.survivor ? this.keptHealth(player) : 0;
      this.lifecycle.damage(player, spec.playerDamage, attacker.id, kept);
    }
  }

  private keptHealth(player: PlayerEntity): number {
    const ceiling = this.survivorHealth(player);
    return Math.min(player.health, ceiling);
  }

  private survivorAmong(caught: readonly PlayerEntity[], damage: number): PlayerEntity | null {
    const everyoneDown = caught.every((player) => this.lifecycle.wouldDown(player, damage));
    return caught.length > 1 && everyoneDown ? this.world.random.pick(caught) : null;
  }

  private survivorHealth(player: PlayerEntity): number {
    const fraction = this.world.random.range(
      BLAST_SURVIVOR_HEALTH.minFraction,
      BLAST_SURVIVOR_HEALTH.maxFraction,
    );
    return Math.max(1, Math.round(player.maxHealth * fraction));
  }
}
