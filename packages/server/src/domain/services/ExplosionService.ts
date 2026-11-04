import { BLAST_SURVIVOR_HEALTH } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import type { Body } from '../entities/Body.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { Blast } from './Blast.ts';
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

  blast(blasts: readonly Blast[], attacker: PlayerEntity, weapon: WeaponId): void {
    for (const { center, spec } of blasts) {
      for (const enemy of [...this.world.enemies.values()]) {
        if (isCaught(enemy, center, spec.radius)) {
          this.enemyDamage.damage(enemy, spec.enemyDamage, attacker, weapon);
        }
      }
      this.wreckage.blast(center, spec.radius, spec.obstacleDamage, attacker.id);
    }
    if (this.friendlyFire) {
      this.blastPlayers(blasts, attacker);
    }
  }

  private blastPlayers(blasts: readonly Blast[], attacker: PlayerEntity): void {
    const totals = new Map<PlayerEntity, number>();
    for (const { center, spec } of blasts) {
      for (const player of this.world.players.values()) {
        if (player.isAlive && isCaught(player, center, spec.radius)) {
          totals.set(player, (totals.get(player) ?? 0) + spec.playerDamage);
        }
      }
    }
    const survivor = this.survivorAmong(totals);
    for (const [player, damage] of totals) {
      const kept = player === survivor ? this.keptHealth(player) : 0;
      this.lifecycle.damage(player, damage, attacker.id, kept);
    }
  }

  private keptHealth(player: PlayerEntity): number {
    const ceiling = this.survivorHealth(player);
    return Math.min(player.health, ceiling);
  }

  private survivorAmong(totals: ReadonlyMap<PlayerEntity, number>): PlayerEntity | null {
    const caught = [...totals.keys()];
    const everyoneDown = caught.every((player) =>
      this.lifecycle.wouldDown(player, totals.get(player) ?? 0),
    );
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
