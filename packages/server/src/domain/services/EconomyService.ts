import { GameEventType } from '@graveshift/shared/protocol';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchEventBus } from '../match/MatchEventBus.ts';

export class EconomyService {
  private readonly events: MatchEventBus;

  constructor(events: MatchEventBus) {
    this.events = events;
  }

  award(player: PlayerEntity, baseAmount: number): void {
    const amount = Math.round(baseAmount * player.hero.modifiers.coinMultiplier);
    if (amount <= 0) {
      return;
    }
    player.coins += amount;
    this.events.emit({ type: GameEventType.CoinsEarned, playerId: player.id, amount });
  }

  spend(player: PlayerEntity, amount: number): void {
    if (amount > player.coins) {
      throw new RangeError(`Player ${player.id} cannot spend ${amount} coins`);
    }
    player.coins -= amount;
    this.events.emit({ type: GameEventType.CoinsSpent, playerId: player.id, amount });
  }
}
