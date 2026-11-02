import { PickupEffect } from '@graveshift/shared/config';
import { fractionOf } from '@graveshift/shared/core';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { ShopService } from '../services/ShopService.ts';
import type { WaveDirector } from '../waves/WaveDirector.ts';
import { createBotDecision } from './BotDecision.ts';
import { botInput } from './botInput.ts';
import { buildBotSituation, needsShopping } from './buildBotSituation.ts';
import { BotPilot } from './BotPilot.ts';
import type { BotSituation } from './BotSituation.ts';
import { bestOwnedWeapon, botShoppingList } from './botShoppingList.ts';

const MAX_PURCHASES_PER_VISIT = 12;

export class BotControlSystem {
  private readonly world: MatchWorld;
  private readonly shop: ShopService;
  private readonly director: WaveDirector;
  private readonly merchants: MerchantService;
  private readonly pilots = new Map<number, BotPilot>();
  private readonly shoppedWave = new Map<number, number>();
  private readonly decision = createBotDecision();

  constructor(
    world: MatchWorld,
    shop: ShopService,
    director: WaveDirector,
    merchants: MerchantService,
  ) {
    this.world = world;
    this.shop = shop;
    this.director = director;
    this.merchants = merchants;
  }

  update(): void {
    const players = [...this.world.players.values()];
    const enemies = [...this.world.enemies.values()].map((enemy) => enemy.position);
    const merchant = this.merchants.aliveMerchant;
    const heals = [...this.world.pickups.values()]
      .filter((pickup) => pickup.definition.effect === PickupEffect.Heal)
      .map((pickup) => pickup.position);
    for (const bot of players) {
      if (!bot.isBot || !bot.isAlive) {
        continue;
      }
      this.runShopErrand(bot);
      const situation = buildBotSituation({
        self: bot.position,
        teammates: players
          .filter((player) => player !== bot)
          .map((player) => ({
            position: player.position,
            life: player.life,
            isHuman: !player.isBot,
          })),
        enemies,
        heals,
        healthFraction: fractionOf(bot.health, bot.maxHealth),
        merchant: merchant === null ? null : merchant.position,
        needsShopping: this.needsShopping(bot),
      });
      this.pilot(bot, situation);
    }
  }

  private pilot(bot: PlayerEntity, situation: BotSituation): void {
    this.pilotOf(bot).decide(situation, this.decision);
    bot.enqueueInput(botInput(this.decision, bot.lastInputSequence + 1, this.world.tick));
  }

  private needsShopping(bot: PlayerEntity): boolean {
    return needsShopping(
      this.director.isIntermission,
      this.merchants.aliveMerchant !== null,
      this.shoppedWave.get(bot.id),
      this.director.wave,
    );
  }

  private runShopErrand(bot: PlayerEntity): void {
    if (!this.director.isIntermission) {
      return;
    }
    if (this.needsShopping(bot) && this.shop.isServing(bot)) {
      this.buyEverythingAffordable(bot);
      this.shoppedWave.set(bot.id, this.director.wave);
    }
    if (!this.needsShopping(bot)) {
      this.director.voteSkip(bot.id);
    }
  }

  private buyEverythingAffordable(bot: PlayerEntity): void {
    for (let purchases = 0; purchases < MAX_PURCHASES_PER_VISIT; purchases += 1) {
      const offers = botShoppingList(bot.arsenal.loadout, bot.health / bot.maxHealth);
      if (!offers.some((offer) => this.shop.purchase(bot, offer) === null)) {
        break;
      }
    }
    const main = bestOwnedWeapon(bot.arsenal.loadout);
    if (main !== undefined) {
      bot.arsenal.switchTo(main);
    }
  }

  private pilotOf(bot: PlayerEntity): BotPilot {
    let pilot = this.pilots.get(bot.id);
    if (pilot === undefined) {
      pilot = new BotPilot(this.world.map, this.world.random);
      this.pilots.set(bot.id, pilot);
    }
    return pilot;
  }
}
