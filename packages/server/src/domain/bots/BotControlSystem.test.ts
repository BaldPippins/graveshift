import { describe, expect, it } from 'vitest';
import {
  HEROES,
  HeroId,
  MeleeWeaponId,
  MERCHANT_RULES,
  PickupKind,
  PICKUPS,
  RangedWeaponId,
  SIMULATION,
  TrapKind,
} from '@graveshift/shared/config';
import { SeededRandom, vec2 } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { MAP_DEFINITIONS, MapId, parseTileMap } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { createCombat } from '../testing/createCombat.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { MerchantService } from '../services/MerchantService.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { ShopService } from '../services/ShopService.ts';
import { PickupSystem } from '../systems/PickupSystem.ts';
import { PlayerControlSystem } from '../systems/PlayerControlSystem.ts';
import { BotControlSystem } from './BotControlSystem.ts';
import { BOT_REARM_PATIENCE_TICKS } from './TrapRearmPlanner.ts';
import type { WaveSchedule } from './WaveSchedule.ts';

const BOT_ID = 7;
const INTERMISSION_TICKS = SIMULATION.tickRate * 20;
const INTERMISSIONS = 12;

class FixedSchedule implements WaveSchedule {
  wave = 1;
  skipVoted = false;
  readonly isIntermission: boolean;

  constructor(isIntermission: boolean) {
    this.isIntermission = isIntermission;
  }

  voteSkip(): void {
    this.skipVoted = true;
  }
}

interface QuietShift {
  readonly world: MatchWorld;
  readonly bot: PlayerEntity;
  readonly tick: () => void;
}

function quietShift(seed: number): QuietShift {
  const events = new MatchEventBus();
  const world = new MatchWorld(
    parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
    new SeededRandom(seed),
    events,
  );
  const economy = new EconomyService(events);
  const lifecycle = new PlayerLifecycle(events);
  const merchants = new MerchantService(world);
  const shop = new ShopService(events, economy, lifecycle, merchants);
  const bots = new BotControlSystem(
    world,
    shop,
    new FixedSchedule(false),
    merchants,
    createCombat(world, true).traps,
  );
  const control = new PlayerControlSystem(world);
  const pickups = new PickupSystem(world, economy, lifecycle);
  const bot = new PlayerEntity(
    BOT_ID,
    'Фрося',
    HEROES[HeroId.Lamplighter],
    true,
    world.map.playerSpawnPoint(0),
  );
  world.players.set(bot.id, bot);
  const tick = (): void => {
    bots.update();
    control.update();
    pickups.update();
    world.tick += 1;
  };
  return { world, bot, tick };
}

function ticksUntil(shift: QuietShift, done: () => boolean, maxSeconds: number): number {
  let ticks = 0;
  while (!done() && ticks < SIMULATION.tickRate * maxSeconds) {
    shift.tick();
    ticks += 1;
  }
  return ticks;
}

interface RevivalRun {
  readonly reviverIds: readonly (number | null)[];
  readonly coinsLeft: number;
  readonly intermissionsWaited: number;
}

interface IntermissionOptions {
  readonly merchantDead: boolean;
  readonly trapsArmed: boolean;
}

const REVIVAL_BREAKS: IntermissionOptions = { merchantDead: true, trapsArmed: true };

function runIntermissions(
  seed: number,
  coins: number,
  options: IntermissionOptions = REVIVAL_BREAKS,
): RevivalRun {
  const events = new MatchEventBus();
  const reviverIds: (number | null)[] = [];
  events.on(GameEventType.MerchantReturned, (event) => {
    reviverIds.push(event.reviverId);
  });
  const world = new MatchWorld(
    parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
    new SeededRandom(seed),
    events,
  );
  const merchants = new MerchantService(world);
  const shop = new ShopService(
    events,
    new EconomyService(events),
    new PlayerLifecycle(events),
    merchants,
  );
  const schedule = new FixedSchedule(true);
  const traps = createCombat(world, true).traps;
  if (options.trapsArmed) {
    traps.armEverySpot();
  }
  const bots = new BotControlSystem(world, shop, schedule, merchants, traps);
  const control = new PlayerControlSystem(world);
  const bot = new PlayerEntity(
    BOT_ID,
    'Фрося',
    HEROES[HeroId.Lamplighter],
    true,
    world.map.playerSpawnPoint(0),
  );
  bot.coins = coins;
  world.players.set(bot.id, bot);
  if (options.merchantDead) {
    merchants.damage(MERCHANT_RULES.maxHealth, null);
  }
  const spent = (): boolean => reviverIds.length > 0 || bot.coins < coins;
  let intermissionsWaited = 0;
  while (!spent() && intermissionsWaited < INTERMISSIONS) {
    for (let tick = 0; tick < INTERMISSION_TICKS && !spent(); tick += 1) {
      bots.update();
      control.update();
      world.tick += 1;
    }
    intermissionsWaited += 1;
    schedule.wave += 1;
  }
  return { reviverIds, coinsLeft: bot.coins, intermissionsWaited };
}

const BREAK_COINS = 120;
const STANDING_OFFSET = { x: 0.2, y: 0.1 };

interface TrapBreak {
  readonly skipVoted: boolean;
  readonly coinsLeft: number;
}

function breakOnBearTrap(seed: number): TrapBreak {
  const events = new MatchEventBus();
  const world = new MatchWorld(
    parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
    new SeededRandom(seed),
    events,
  );
  const merchants = new MerchantService(world);
  const shop = new ShopService(
    events,
    new EconomyService(events),
    new PlayerLifecycle(events),
    merchants,
  );
  const schedule = new FixedSchedule(true);
  const traps = createCombat(world, true).traps;
  const bearTrap = traps.vacantSpots.find((spot) => spot.kind === TrapKind.BearTrap);
  if (bearTrap === undefined) {
    throw new Error('graveyard has no bear trap spot');
  }
  const bots = new BotControlSystem(world, shop, schedule, merchants, traps);
  const control = new PlayerControlSystem(world);
  const bot = new PlayerEntity(
    BOT_ID,
    'Фрося',
    HEROES[HeroId.Lamplighter],
    true,
    vec2(bearTrap.center.x + STANDING_OFFSET.x, bearTrap.center.y + STANDING_OFFSET.y),
  );
  bot.coins = BREAK_COINS;
  world.players.set(bot.id, bot);
  merchants.damage(MERCHANT_RULES.maxHealth, null);
  for (let tick = 0; tick <= BOT_REARM_PATIENCE_TICKS && !schedule.skipVoted; tick += 1) {
    bots.update();
    control.update();
    world.tick += 1;
  }
  return { skipVoted: schedule.skipVoted, coinsLeft: bot.coins };
}

function shopOnce(coins: number): PlayerEntity {
  const events = new MatchEventBus();
  const world = new MatchWorld(
    parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
    new SeededRandom(1),
    events,
  );
  const merchants = new MerchantService(world);
  const shop = new ShopService(
    events,
    new EconomyService(events),
    new PlayerLifecycle(events),
    merchants,
  );
  const merchant = merchants.merchant;
  if (merchant === null) {
    throw new Error('graveyard has no merchant');
  }
  const traps = createCombat(world, true).traps;
  const bots = new BotControlSystem(world, shop, new FixedSchedule(true), merchants, traps);
  const bot = new PlayerEntity(
    BOT_ID,
    'Фрося',
    HEROES[HeroId.Lamplighter],
    true,
    vec2(merchant.position.x + 1, merchant.position.y),
  );
  bot.coins = coins;
  world.players.set(bot.id, bot);
  bots.update();
  return bot;
}

describe('BotControlSystem', () => {
  it('buys the best weapons it can afford and fights with them', () => {
    const bot = shopOnce(700);
    expect(bot.arsenal.current).toBe(RangedWeaponId.Gatling);
    expect(bot.arsenal.melee).toBe(MeleeWeaponId.Sword);
  });

  it('limps over to a heal pickup when badly hurt and picks it up', () => {
    const shift = quietShift(3);
    const spot = shift.world.map.playerSpawnPoint(2);
    new PickupSpawner(shift.world).spawn(PickupKind.Heart, spot);
    shift.bot.health = shift.bot.maxHealth * 0.3;
    const wounded = shift.bot.health;
    ticksUntil(shift, () => shift.world.pickups.size === 0, 15);
    expect(shift.world.pickups.size).toBe(0);
    expect(shift.bot.health).toBeGreaterThan(wounded);
  });

  it('wanders off to grab a coin when there is nothing to fight', () => {
    const shift = quietShift(4);
    const spot = shift.world.map.playerSpawnPoint(2);
    new PickupSpawner(shift.world).spawn(PickupKind.Coins, spot);
    ticksUntil(shift, () => shift.bot.coins > 0, 15);
    expect(shift.bot.coins).toBe(PICKUPS[PickupKind.Coins].amount);
  });

  it('sometimes walks to the grave and pays to bring the merchant back', () => {
    const run = runIntermissions(5, MERCHANT_RULES.revivePrice + 50);
    expect(run.reviverIds).toEqual([BOT_ID]);
    expect(run.coinsLeft).toBeLessThanOrEqual(50);
  });

  it('does not always volunteer at the first break', () => {
    const waits = [1, 2, 3, 4, 5, 6, 7, 8].map(
      (seed) => runIntermissions(seed, MERCHANT_RULES.revivePrice).intermissionsWaited,
    );
    expect(waits.some((wait) => wait > 1)).toBe(true);
    expect(waits.some((wait) => wait === 1)).toBe(true);
  });

  it('sometimes spends coins on rearming a vacant trap during a break', () => {
    const coins = [1, 2, 3, 4, 5, 6].map(
      (seed) => runIntermissions(seed, 120, { merchantDead: true, trapsArmed: false }).coinsLeft,
    );
    expect(coins.some((left) => left < 120)).toBe(true);
    expect(coins.every((left) => left >= 0)).toBe(true);
  });

  it('steps off a trap it stands on, rearms it and then votes to skip', () => {
    const breaks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed) => breakOnBearTrap(seed));
    expect(breaks.every((run) => run.skipVoted)).toBe(true);
    expect(breaks.some((run) => run.coinsLeft < BREAK_COINS)).toBe(true);
  });

  it('never revives the merchant without enough coins', () => {
    const run = runIntermissions(5, MERCHANT_RULES.revivePrice - 1);
    expect(run.reviverIds).toEqual([]);
  });
});
