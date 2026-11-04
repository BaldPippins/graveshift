import { MERCHANT_RULES } from '@graveshift/shared/config';
import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';
import type { MatchEventBus } from '../match/MatchEventBus.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import { MerchantWalker } from '../merchant/MerchantWalker.ts';

export class MerchantService {
  readonly merchant: MerchantEntity | null;
  private readonly walker: MerchantWalker | null;
  private readonly events: MatchEventBus;
  private readonly unsubscribe: Unsubscribe;

  constructor(world: MatchWorld) {
    this.merchant = world.merchant;
    this.walker =
      world.merchant === null
        ? null
        : new MerchantWalker(world.map, world.random, world.merchant.position);
    this.events = world.events;
    this.unsubscribe = world.events.on(GameEventType.WaveStarted, () => {
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
      this.startle(merchant);
      return;
    }
    merchant.wavesUntilReturn = MERCHANT_RULES.absenceWaves;
    this.events.emit({ type: GameEventType.MerchantKilled, killerId: attackerId });
  }

  update(): void {
    const merchant = this.aliveMerchant;
    if (merchant !== null && this.walker !== null) {
      this.walker.step(merchant);
    }
  }

  revive(reviverId: number): void {
    const merchant = this.merchant;
    if (merchant === null || merchant.isAlive) {
      return;
    }
    this.bringBack(merchant, reviverId);
  }

  dispose(): void {
    this.unsubscribe();
  }

  private startle(merchant: MerchantEntity): void {
    if (this.walker !== null) {
      this.walker.startle(merchant);
    }
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
    this.bringBack(merchant, null);
  }

  private bringBack(merchant: MerchantEntity, reviverId: number | null): void {
    merchant.health = merchant.maxHealth;
    merchant.wavesUntilReturn = 0;
    this.events.emit({ type: GameEventType.MerchantReturned, reviverId });
  }
}
