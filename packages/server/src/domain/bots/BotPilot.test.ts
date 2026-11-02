import { describe, expect, it } from 'vitest';
import { PICKUP_RULES } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import type { ReadonlyVec2, Vec2 } from '@graveshift/shared/core';
import { stepPlayerMovement } from '@graveshift/shared/rules';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import { createBotDecision } from './BotDecision.ts';
import { BotPilot } from './BotPilot.ts';
import type { BotSituation } from './BotSituation.ts';

const MOVE_SPEED = 4;
const SETTLE_DECISIONS = 30;
const EMPTY_SITUATION: BotSituation = {
  self: { x: 0, y: 0 },
  allies: [],
  downedAllies: [],
  enemies: [],
  heals: [],
  healthFraction: 1,
  leader: null,
  errand: null,
};

const POCKET_MAP = parseTileMap({
  id: MapId.Graveyard,
  rows: [
    '##########',
    '#S.......#',
    '#.######.#',
    '#.#....#.#',
    '#.#.P..#.#',
    '#........#',
    '##########',
  ],
});

const OPEN_MAP = parseTileMap({
  id: MapId.Graveyard,
  rows: [
    '##############',
    '#S..........P#',
    ...Array.from({ length: 11 }, () => '#............#'),
    '##############',
  ],
});

function settleBeside(seed: number, situation: BotSituation, decisions: number): Vec2 {
  const pilot = new BotPilot(OPEN_MAP, new SeededRandom(seed), seed);
  const decision = createBotDecision();
  const position = { x: situation.self.x, y: situation.self.y };
  for (let step = 0; step < decisions; step += 1) {
    pilot.decide({ ...situation, self: position }, decision);
    stepPlayerMovement(position, decision, MOVE_SPEED, OPEN_MAP);
  }
  return position;
}

function fly(
  map: TileMap,
  start: ReadonlyVec2,
  downedAllies: readonly ReadonlyVec2[],
  enemies: readonly ReadonlyVec2[],
  decisions: number,
): Vec2 {
  const pilot = new BotPilot(map, new SeededRandom(1), 0);
  const decision = createBotDecision();
  const position = { x: start.x, y: start.y };
  for (let step = 0; step < decisions; step += 1) {
    pilot.decide({ ...EMPTY_SITUATION, self: position, downedAllies, enemies }, decision);
    stepPlayerMovement(position, decision, MOVE_SPEED, map);
  }
  return position;
}

describe('BotPilot', () => {
  it('walks around walls to reach a downed ally', () => {
    const ally = { x: 4.5, y: 4.5 };
    const end = fly(POCKET_MAP, { x: 4.5, y: 1.5 }, [ally], [], 30 * 12);
    expect(Math.hypot(end.x - ally.x, end.y - ally.y)).toBeLessThan(1);
  });

  it('walks to a heal pickup when below half health', () => {
    const pilot = new BotPilot(POCKET_MAP, new SeededRandom(1), 0);
    const decision = createBotDecision();
    const heal = { x: 4.5, y: 4.5 };
    const position = { x: 4.5, y: 1.5 };
    for (let step = 0; step < 30 * 12; step += 1) {
      pilot.decide(
        { ...EMPTY_SITUATION, self: position, heals: [heal], healthFraction: 0.3 },
        decision,
      );
      stepPlayerMovement(position, decision, MOVE_SPEED, POCKET_MAP);
    }
    expect(Math.hypot(position.x - heal.x, position.y - heal.y)).toBeLessThan(
      PICKUP_RULES.collectRadius,
    );
  });

  it('ignores heal pickups while healthy', () => {
    const pilot = new BotPilot(POCKET_MAP, new SeededRandom(1), 0);
    const decision = createBotDecision();
    pilot.decide(
      { ...EMPTY_SITUATION, self: { x: 4.5, y: 1.5 }, heals: [{ x: 7.5, y: 1.5 }] },
      decision,
    );
    expect(decision.moveX).toBe(0);
    expect(decision.moveY).toBe(0);
  });

  it('spreads followers into their own spots around the leader', () => {
    const leader = { x: 7, y: 7 };
    const situation = { ...EMPTY_SITUATION, self: { x: 2.5, y: 2.5 }, leader };
    const spots = [1, 2, 3].map((seed) => settleBeside(seed, situation, 30 * 8));
    for (const spot of spots) {
      expect(Math.hypot(spot.x - leader.x, spot.y - leader.y)).toBeGreaterThan(1);
    }
    const [first, second, third] = spots;
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error('Expected three spots');
    }
    const gaps = [
      Math.hypot(first.x - second.x, first.y - second.y),
      Math.hypot(second.x - third.x, second.y - third.y),
      Math.hypot(first.x - third.x, first.y - third.y),
    ];
    expect(Math.min(...gaps)).toBeGreaterThan(1);
  });

  it('steps away from an ally it stands on', () => {
    const ally = { x: 6.8, y: 6.5 };
    const situation = { ...EMPTY_SITUATION, self: { x: 6.5, y: 6.5 }, allies: [ally] };
    const end = settleBeside(1, situation, 15);
    expect(Math.hypot(end.x - ally.x, end.y - ally.y)).toBeGreaterThan(1.2);
  });

  it('kites sideways instead of into the wall behind it', () => {
    const start = { x: 1.5, y: 5.5 };
    const end = fly(POCKET_MAP, start, [], [{ x: 1.5, y: 3.8 }], 15);
    expect(end.x - start.x).toBeGreaterThan(0.5);
  });

  it('aims and fires only at enemies it can see, after a reaction delay', () => {
    const pilot = new BotPilot(POCKET_MAP, new SeededRandom(1), 0);
    const decision = createBotDecision();
    const hidden: BotSituation = {
      ...EMPTY_SITUATION,
      self: { x: 4.5, y: 1.5 },
      enemies: [{ x: 4.5, y: 4.5 }],
    };
    for (let step = 0; step < SETTLE_DECISIONS; step += 1) {
      pilot.decide(hidden, decision);
      expect(decision.fire).toBe(false);
    }
    const visible: BotSituation = {
      ...EMPTY_SITUATION,
      self: { x: 4.5, y: 1.5 },
      enemies: [{ x: 7.5, y: 1.5 }],
    };
    pilot.decide(visible, decision);
    expect(decision.fire).toBe(false);
    for (let step = 0; step < SETTLE_DECISIONS; step += 1) {
      pilot.decide(visible, decision);
    }
    expect(decision.fire).toBe(true);
    expect(Math.abs(decision.aim)).toBeLessThan(0.2);
  });

  it('holds fire and sidesteps while an ally stands in the line of fire', () => {
    const pilot = new BotPilot(POCKET_MAP, new SeededRandom(1), 0);
    const decision = createBotDecision();
    const blocked: BotSituation = {
      ...EMPTY_SITUATION,
      self: { x: 4.5, y: 5.5 },
      allies: [{ x: 6.5, y: 5.5 }],
      enemies: [{ x: 8.3, y: 5.5 }],
    };
    for (let step = 0; step < SETTLE_DECISIONS; step += 1) {
      pilot.decide(blocked, decision);
      expect(decision.fire).toBe(false);
    }
    expect(Math.abs(decision.moveY)).toBeGreaterThan(0.9);
  });
});
