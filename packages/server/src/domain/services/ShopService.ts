import { SHOP_RULES } from '@graveshift/shared/config';
import { assertNever } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import {
  MerchantAccess,
  merchantAccessFor,
  quotePurchase,
  ShopOfferKind,
} from '@graveshift/shared/rules';
import type { PurchaseRejection, ShopOffer } from '@graveshift/shared/rules';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchEventBus } from '../match/MatchEventBus.ts';
import type { EconomyService } from './EconomyService.ts';
import type { MerchantService } from './MerchantService.ts';
import type { PlayerLifecycle } from './PlayerLifecycle.ts';

export class ShopService {
  private readonly events: MatchEventBus;
  private readonly economy: EconomyService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly merchants: MerchantService;

  constructor(
    events: MatchEventBus,
    economy: EconomyService,
    lifecycle: PlayerLifecycle,
    merchants: MerchantService,
  ) {
    this.events = events;
    this.economy = economy;
    this.lifecycle = lifecycle;
    this.merchants = merchants;
  }

  accessFor(player: PlayerEntity): MerchantAccess {
    const merchant = this.merchants.merchant;
    if (merchant === null) {
      return MerchantAccess.Gone;
    }
    return merchantAccessFor(player.position, merchant.position, merchant.isAlive);
  }

  isServing(player: PlayerEntity): boolean {
    return this.accessFor(player) === MerchantAccess.Serving;
  }

  purchase(player: PlayerEntity, offer: ShopOffer): PurchaseRejection | null {
    const quote = quotePurchase(offer, {
      loadout: player.arsenal.loadout,
      coins: player.coins,
      health: player.health,
      maxHealth: player.maxHealth,
      lifeState: player.life,
      merchantAccess: this.accessFor(player),
      allowedWeapons: player.arsenal.allowedWeapons,
    });
    if (quote.rejection !== null) {
      return quote.rejection;
    }
    this.economy.spend(player, quote.price);
    this.deliver(player, offer);
    return null;
  }

  private deliver(player: PlayerEntity, offer: ShopOffer): void {
    switch (offer.kind) {
      case ShopOfferKind.UnlockWeapon:
        player.arsenal.unlock(offer.weapon);
        this.events.emit({
          type: GameEventType.WeaponUnlocked,
          playerId: player.id,
          weapon: offer.weapon,
        });
        return;
      case ShopOfferKind.UpgradeWeapon: {
        const level = player.arsenal.upgrade(offer.weapon, offer.stat);
        this.events.emit({
          type: GameEventType.WeaponUpgraded,
          playerId: player.id,
          weapon: offer.weapon,
          stat: offer.stat,
          level,
        });
        return;
      }
      case ShopOfferKind.Heal: {
        const amount = this.lifecycle.heal(player, player.maxHealth * SHOP_RULES.healFraction);
        this.events.emit({ type: GameEventType.PlayerHealed, playerId: player.id, amount });
        return;
      }
      case ShopOfferKind.ReviveMerchant:
        this.merchants.revive(player.id);
        return;
      default:
        assertNever(offer);
    }
  }
}
