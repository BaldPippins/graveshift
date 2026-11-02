import { MERCHANT_RULES } from '@graveshift/shared/config';
import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { MatchEventBus } from '../match/MatchEventBus.ts';

export class MerchantService {
  readonly merchant: MerchantEntity | null;
  private readonly events: MatchEventBus;
  private readonly unsubscribe: Unsubscribe;

  constructor(merchant: MerchantEntity | null, events: MatchEventBus) {
    this.merchant = merchant;
    this.events = events;
    this.unsubscribe = events.on(GameEventType.WaveStarted, () => {
      this.countDownAbsence();
    });
  }

  get aliveMerchant(): MerchantEntity | null {
    return this.merchant !== null && this.merchant.isAlive ? this.merchant : null;
  }

  damage(rawAmount: number, attackerId: number | null): void {
    const merchant = this.aliveMerchant;
    if (merchant === null) {
      return;
    }
    merchant.health = Math.max(0, merchant.health - rawAmount);
    if (merchant.isAlive) {
      return;
    }
    merchant.wavesUntilReturn = MERCHANT_RULES.absenceWaves;
    this.events.emit({ type: GameEventType.MerchantKilled, killerId: attackerId });
  }

  dispose(): void {
    this.unsubscribe();
  }

  private countDownAbsence(): void {
    const merchant = this.merchant;
    if (merchant === null || merchant.isAlive) {
      return;
    }
    merchant.wavesUntilReturn -= 1;
    if (merchant.wavesUntilReturn > 0) {
      return;
    }
    merchant.health = merchant.maxHealth;
    this.events.emit({ type: GameEventType.MerchantReturned });
  }
}
