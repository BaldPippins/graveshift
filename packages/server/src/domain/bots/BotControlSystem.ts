import { MERCHANT_RULES, PickupEffect } from '@graveshift/shared/config';
import { distanceSquared, fractionOf } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { isWithinTrapReach, MerchantAccess, ShopOfferKind } from '@graveshift/shared/rules';
import type { TrapSpot } from '@graveshift/shared/rules';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { MerchantService } from '../services/MerchantService.ts';
import type { TrapService } from '../services/TrapService.ts';
import type { ShopService } from '../services/ShopService.ts';
import { createBotDecision } from './BotDecision.ts';
import { botInput } from './botInput.ts';
import { buildBotSituation, needsShopping } from './buildBotSituation.ts';
import { BotPilot } from './BotPilot.ts';
import type { BotSituation } from './BotSituation.ts';
import { bestOwnedWeapon, botShoppingList } from './botShoppingList.ts';
import { MerchantRevivalPlanner } from './MerchantRevivalPlanner.ts';
import { TrapRearmPlanner } from './TrapRearmPlanner.ts';
import type { WaveSchedule } from './WaveSchedule.ts';

const MAX_PURCHASES_PER_VISIT = 12;
const ARMING_CLEARANCE = 0.9;

export class BotControlSystem {
  private readonly world: MatchWorld;
  private readonly shop: ShopService;
  private readonly director: WaveSchedule;
  private readonly merchants: MerchantService;
  private readonly traps: TrapService;
  private readonly pilots = new Map<number, BotPilot>();
  private readonly shoppedWave = new Map<number, number>();
  private readonly decision = createBotDecision();
  private readonly revival: MerchantRevivalPlanner;
  private readonly rearm: TrapRearmPlanner;

  constructor(
    world: MatchWorld,
    shop: ShopService,
    director: WaveSchedule,
    merchants: MerchantService,
    traps: TrapService,
  ) {
    this.world = world;
    this.shop = shop;
    this.director = director;
    this.merchants = merchants;
    this.traps = traps;
    this.revival = new MerchantRevivalPlanner(world.random);
    this.rearm = new TrapRearmPlanner(world.random, traps);
  }

  update(): void {
    const players = [...this.world.players.values()];
    const enemies = [...this.world.enemies.values()];
    const enemyPositions = enemies.map((enemy) => enemy.position);
    const meleeTargets = enemies
      .filter((enemy) => !enemy.definition.airborne)
      .map((enemy) => enemy.position);
    const merchant = this.merchants.aliveMerchant;
    const pickups = [...this.world.pickups.values()];
    const heals = pickups
      .filter((pickup) => pickup.definition.effect === PickupEffect.Heal)
      .map((pickup) => pickup.position);
    const coins = pickups
      .filter((pickup) => pickup.definition.effect === PickupEffect.Coins)
      .map((pickup) => pickup.position);
    const kegs = this.traps.shootableTraps.map((trap) => trap.position);
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
        enemies: enemyPositions,
        meleeTargets,
        heals,
        coins,
        kegs,
        healthFraction: fractionOf(bot.health, bot.maxHealth),
        merchant: merchant === null ? null : merchant.position,
        errand: this.errandOf(bot),
        meleeReach: bot.meleeStats.reach,
        meleeArcRadians: bot.meleeStats.arcRadians,
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

  private errandOf(bot: PlayerEntity): ReadonlyVec2 | null {
    const merchant = this.merchants.merchant;
    if (merchant !== null && (this.needsShopping(bot) || this.goesToRevive(bot))) {
      return merchant.position;
    }
    const trap = this.rearmTargetOf(bot);
    return trap === null ? null : trap.center;
  }

  private rearmTargetOf(bot: PlayerEntity): TrapSpot | null {
    if (!this.director.isIntermission || this.needsShopping(bot) || this.goesToRevive(bot)) {
      return null;
    }
    return this.rearm.targetFor({
      botId: bot.id,
      wave: this.director.wave,
      position: bot.position,
      coins: bot.coins,
    });
  }

  private rearmTrap(bot: PlayerEntity): boolean {
    const trap = this.rearmTargetOf(bot);
    if (trap === null) {
      return false;
    }
    const clear = distanceSquared(bot.position, trap.center) >= ARMING_CLEARANCE ** 2;
    if (clear && isWithinTrapReach(bot.position, trap)) {
      this.traps.arm(bot, trap.index);
      this.rearm.done(bot.id);
      return false;
    }
    return true;
  }

  private goesToRevive(bot: PlayerEntity): boolean {
    return (
      this.director.isIntermission &&
      this.merchants.merchant !== null &&
      this.merchants.aliveMerchant === null &&
      bot.coins >= MERCHANT_RULES.revivePrice &&
      this.revival.isVolunteer(bot.id, this.director.wave)
    );
  }

  private runShopErrand(bot: PlayerEntity): void {
    if (!this.director.isIntermission) {
      return;
    }
    if (this.goesToRevive(bot) && this.shop.accessFor(bot) === MerchantAccess.Grave) {
      this.shop.purchase(bot, { kind: ShopOfferKind.ReviveMerchant });
    }
    if (this.needsShopping(bot) && this.shop.isServing(bot)) {
      this.buyEverythingAffordable(bot);
      this.shoppedWave.set(bot.id, this.director.wave);
    }
    const rearming = this.rearmTrap(bot);
    if (!this.needsShopping(bot) && !this.goesToRevive(bot) && !rearming) {
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
      pilot = new BotPilot(this.world.map, this.world.random, this.pilots.size);
      this.pilots.set(bot.id, pilot);
    }
    return pilot;
  }
}
