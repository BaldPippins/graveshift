import { describe, expect, it } from 'vitest';
import {
  HEROES,
  HeroId,
  MERCHANT_RULES,
  PickupKind,
  PICKUPS,
  SIMULATION,
} from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
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
import type { WaveSchedule } from './WaveSchedule.ts';

const BOT_ID = 7;
const INTERMISSION_TICKS = SIMULATION.tickRate * 20;
const INTERMISSIONS = 12;

class FixedSchedule implements WaveSchedule {
  wave = 1;
  readonly isIntermission: boolean;

  constructor(isIntermission: boolean) {
    this.isIntermission = isIntermission;
  }

  voteSkip(): void {
    return;
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

function runIntermissions(seed: number, coins: number): RevivalRun {
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
  const bots = new BotControlSystem(
    world,
    shop,
    schedule,
    merchants,
    createCombat(world, true).traps,
  );
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
  merchants.damage(MERCHANT_RULES.maxHealth, null);
  const revived = (): boolean => reviverIds.length > 0;
  let intermissionsWaited = 0;
  while (!revived() && intermissionsWaited < INTERMISSIONS) {
    for (let tick = 0; tick < INTERMISSION_TICKS && !revived(); tick += 1) {
      bots.update();
      control.update();
      world.tick += 1;
    }
    intermissionsWaited += 1;
    schedule.wave += 1;
  }
  return { reviverIds, coinsLeft: bot.coins, intermissionsWaited };
}

describe('BotControlSystem', () => {
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

  it('never revives the merchant without enough coins', () => {
    const run = runIntermissions(5, MERCHANT_RULES.revivePrice - 1);
    expect(run.reviverIds).toEqual([]);
  });
});
