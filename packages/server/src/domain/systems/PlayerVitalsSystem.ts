import { PLAYER_RULES, SIMULATION } from '@graveshift/shared/config';
import { distanceSquared } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import { reviveRate } from '@graveshift/shared/rules';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';

export class PlayerVitalsSystem {
  private readonly world: MatchWorld;
  private readonly lifecycle: PlayerLifecycle;

  constructor(world: MatchWorld, lifecycle: PlayerLifecycle) {
    this.world = world;
    this.lifecycle = lifecycle;
  }

  update(): void {
    for (const player of this.world.players.values()) {
      if (player.life === LifeState.Alive) {
        this.regenerate(player);
      } else if (player.life === LifeState.Downed) {
        this.progressDowned(player);
      }
    }
  }

  private regenerate(player: PlayerEntity): void {
    const regen = player.hero.modifiers.healthRegenPerSecond;
    if (regen > 0) {
      this.lifecycle.heal(player, regen * SIMULATION.tickSeconds);
    }
  }

  private progressDowned(player: PlayerEntity): void {
    const revivers = this.reviversOf(player);
    const reviver = revivers[0];
    if (reviver === undefined) {
      player.reviveProgress = 0;
      player.bleedoutRemainingSeconds -= SIMULATION.tickSeconds;
      if (player.bleedoutRemainingSeconds <= 0) {
        this.lifecycle.bleedOut(player);
      }
      return;
    }
    const rate = reviveRate(revivers.map((helper) => helper.hero.modifiers.reviveSpeedMultiplier));
    player.reviveProgress += (SIMULATION.tickSeconds * rate) / PLAYER_RULES.reviveSeconds;
    if (player.reviveProgress >= 1) {
      this.lifecycle.revive(player, reviver.id);
    }
  }

  private reviversOf(downed: PlayerEntity): PlayerEntity[] {
    const radiusSquared = PLAYER_RULES.reviveRadius * PLAYER_RULES.reviveRadius;
    return [...this.world.players.values()]
      .filter(
        (candidate) =>
          candidate !== downed &&
          candidate.isAlive &&
          !candidate.isIdle &&
          distanceSquared(candidate.position, downed.position) <= radiusSquared,
      )
      .sort(
        (left, right) =>
          right.hero.modifiers.reviveSpeedMultiplier - left.hero.modifiers.reviveSpeedMultiplier,
      );
  }
}
