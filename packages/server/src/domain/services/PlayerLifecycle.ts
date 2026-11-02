import { PLAYER_RULES } from '@graveshift/shared/config';
import { LifeState } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchEventBus } from '../match/MatchEventBus.ts';

export class PlayerLifecycle {
  private readonly events: MatchEventBus;

  constructor(events: MatchEventBus) {
    this.events = events;
  }

  damage(player: PlayerEntity, rawAmount: number, attackerId: number | null): void {
    if (!player.isAlive) {
      return;
    }
    const amount = Math.min(player.health, rawAmount * player.hero.modifiers.damageTakenMultiplier);
    player.health -= amount;
    this.events.emit({
      type: GameEventType.PlayerDamaged,
      playerId: player.id,
      amount,
      attackerId,
    });
    if (player.health <= 0) {
      this.down(player);
    }
  }

  heal(player: PlayerEntity, rawAmount: number): number {
    if (!player.isAlive) {
      return 0;
    }
    const amount = Math.min(rawAmount, player.maxHealth - player.health);
    player.health += amount;
    return amount;
  }

  revive(player: PlayerEntity, reviverId: number): void {
    this.restore(player, PLAYER_RULES.revivedHealthFraction);
    this.events.emit({ type: GameEventType.PlayerRevived, playerId: player.id, reviverId });
  }

  bleedOut(player: PlayerEntity): void {
    player.life = LifeState.Dead;
    player.reviveProgress = 0;
    player.bleedoutRemainingSeconds = 0;
    this.events.emit({ type: GameEventType.PlayerDied, playerId: player.id });
  }

  respawn(player: PlayerEntity, x: number, y: number): void {
    player.position.x = x;
    player.position.y = y;
    this.restore(player, PLAYER_RULES.respawnHealthFraction);
    this.events.emit({ type: GameEventType.PlayerRespawned, playerId: player.id });
  }

  private down(player: PlayerEntity): void {
    player.health = 0;
    player.life = LifeState.Downed;
    player.triggerHeld = false;
    player.reviveProgress = 0;
    player.bleedoutRemainingSeconds = PLAYER_RULES.bleedoutSeconds;
    this.events.emit({ type: GameEventType.PlayerDowned, playerId: player.id });
  }

  private restore(player: PlayerEntity, healthFraction: number): void {
    player.life = LifeState.Alive;
    player.health = Math.max(1, Math.round(player.maxHealth * healthFraction));
    player.reviveProgress = 0;
    player.bleedoutRemainingSeconds = 0;
  }
}
