import { describe, expect, it } from 'vitest';
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

function fly(
  map: TileMap,
  start: ReadonlyVec2,
  downedAllies: readonly ReadonlyVec2[],
  enemies: readonly ReadonlyVec2[],
  decisions: number,
): Vec2 {
  const pilot = new BotPilot(map, new SeededRandom(1));
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

  it('kites sideways instead of into the wall behind it', () => {
    const start = { x: 1.5, y: 5.5 };
    const end = fly(POCKET_MAP, start, [], [{ x: 1.5, y: 3.8 }], 15);
    expect(end.x - start.x).toBeGreaterThan(0.5);
  });

  it('aims and fires only at enemies it can see, after a reaction delay', () => {
    const pilot = new BotPilot(POCKET_MAP, new SeededRandom(1));
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
    const pilot = new BotPilot(POCKET_MAP, new SeededRandom(1));
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
