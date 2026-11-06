import { describe, expect, it } from 'vitest';
import { TrapKind } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import type { TrapSpot } from '@graveshift/shared/rules';
import type { TrapMarket } from '../traps/TrapMarket.ts';
import {
  BOT_REARM_CHANCE,
  BOT_REARM_PATIENCE_TICKS,
  TrapRearmPlanner,
} from './TrapRearmPlanner.ts';

const NEAR: TrapSpot = {
  kind: TrapKind.BearTrap,
  cell: { cx: 2, cy: 2 },
  index: 66,
  center: { x: 2.5, y: 2.5 },
};
const FAR: TrapSpot = {
  kind: TrapKind.PowderKeg,
  cell: { cx: 20, cy: 2 },
  index: 84,
  center: { x: 20.5, y: 2.5 },
};

class FixedMarket implements TrapMarket {
  vacantSpots: readonly TrapSpot[];

  constructor(vacantSpots: readonly TrapSpot[] = [NEAR, FAR]) {
    this.vacantSpots = vacantSpots;
  }

  priceOf(spot: TrapSpot): number {
    return spot.kind === TrapKind.BearTrap ? 20 : 100;
  }
}

const ORIGIN = { x: 0, y: 0 };

describe('TrapRearmPlanner', () => {
  it('volunteers in about a third of breaks and keeps the target for the break', () => {
    const planner = new TrapRearmPlanner(new SeededRandom(3), new FixedMarket());
    const waves = 2000;
    let volunteered = 0;
    for (let wave = 1; wave <= waves; wave += 1) {
      const request = { botId: 1, wave, tick: 0, position: ORIGIN, coins: 500 };
      const target = planner.targetFor(request);
      expect(planner.targetFor(request)).toBe(target);
      volunteered += target === null ? 0 : 1;
    }
    expect(volunteered / waves).toBeCloseTo(BOT_REARM_CHANCE, 1);
  });

  it('picks the nearest affordable spot and leaves it to one bot', () => {
    const planner = new TrapRearmPlanner(new SeededRandom(1), new FixedMarket());
    const targets = new Set<number>();
    for (let wave = 1; wave <= 200 && targets.size < 2; wave += 1) {
      const first = planner.targetFor({ botId: 1, wave, tick: 0, position: ORIGIN, coins: 500 });
      const second = planner.targetFor({ botId: 2, wave, tick: 0, position: ORIGIN, coins: 500 });
      if (first !== null && second !== null) {
        expect(first).toBe(NEAR);
        expect(second).toBe(FAR);
        targets.add(first.index).add(second.index);
      }
    }
    expect(targets.size).toBe(2);
  });

  it('drops the target once coins run short', () => {
    const planner = new TrapRearmPlanner(new SeededRandom(1), new FixedMarket());
    let wave = 1;
    while (planner.targetFor({ botId: 1, wave, tick: 0, position: ORIGIN, coins: 500 }) === null) {
      wave += 1;
    }
    expect(planner.targetFor({ botId: 1, wave, tick: 0, position: ORIGIN, coins: 10 })).toBeNull();
  });

  it('forgets last break claims so another bot can take the spot next break', () => {
    const planner = new TrapRearmPlanner(new SeededRandom(1), new FixedMarket([NEAR]));
    let wave = 1;
    while (volunteer(planner, 1, wave) === null) {
      wave += 1;
    }
    const nextBreaks = Array.from({ length: 40 }, (_, offset) => wave + 1 + offset);
    const taken = nextBreaks.map((nextWave) => volunteer(planner, 2, nextWave));
    expect(taken).toContain(NEAR);
  });

  it('gives up on a target it could not arm in time', () => {
    const planner = new TrapRearmPlanner(new SeededRandom(1), new FixedMarket());
    let wave = 1;
    while (volunteer(planner, 1, wave) === null) {
      wave += 1;
    }
    expect(volunteer(planner, 1, wave, BOT_REARM_PATIENCE_TICKS)).not.toBeNull();
    expect(volunteer(planner, 1, wave, BOT_REARM_PATIENCE_TICKS + 1)).toBeNull();
  });
});

function volunteer(
  planner: TrapRearmPlanner,
  botId: number,
  wave: number,
  tick = 0,
): TrapSpot | null {
  return planner.targetFor({ botId, wave, tick, position: ORIGIN, coins: 500 });
}
