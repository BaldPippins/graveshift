import { describe, expect, it } from 'vitest';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { TargetAimAssist } from './TargetAimAssist.ts';

const ARENA = parseTileMap({
  id: MapId.Graveyard,
  rows: ['##########', '#S......P#', '#........#', '#....#...#', '#........#', '##########'],
});

describe('TargetAimAssist', () => {
  it('snaps to a visible enemy close to the stick direction', () => {
    const assist = new TargetAimAssist(ARENA);
    assist.setTargets([{ x: 7.5, y: 2.2 }]);
    expect(assist.refine(1.5, 2.5, 0.2)).toBeCloseTo(Math.atan2(-0.3, 6), 5);
  });

  it('keeps the stick direction when the enemy is outside the cone', () => {
    const assist = new TargetAimAssist(ARENA);
    assist.setTargets([{ x: 1.5, y: 4.5 }]);
    expect(assist.refine(1.5, 2.5, 0)).toBe(0);
  });

  it('ignores enemies behind a wall', () => {
    const assist = new TargetAimAssist(ARENA);
    assist.setTargets([{ x: 7.5, y: 3.5 }]);
    expect(assist.refine(3.5, 3.5, 0)).toBe(0);
  });
});
