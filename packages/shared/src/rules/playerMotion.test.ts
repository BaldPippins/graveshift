import { describe, expect, it } from 'vitest';
import { SIMULATION } from '../config/simulation.ts';
import { MapId } from '../world/MapDefinition.ts';
import { parseTileMap } from '../world/parseTileMap.ts';
import type { TileMap } from '../world/TileMap.ts';
import { STANDING_STILL, stepPlayerMotion } from './playerMovement.ts';
import type { MotionIntent, PlayerMotion } from './playerMovement.ts';

const MOVE_SPEED = 4;
const RUN_RIGHT: MotionIntent = { moveX: 1, moveY: 0, jump: false };
const JUMP_RIGHT: MotionIntent = { moveX: 1, moveY: 0, jump: true };

function mapOf(...rows: string[]): TileMap {
  return parseTileMap({ id: MapId.Graveyard, rows });
}

function motionAt(x: number, y: number): PlayerMotion {
  return { position: { x, y }, height: 0, verticalSpeed: 0 };
}

function run(motion: PlayerMotion, map: TileMap, intent: MotionIntent, seconds: number): void {
  const steps = Math.round(seconds * SIMULATION.tickRate);
  for (let step = 0; step < steps; step += 1) {
    stepPlayerMotion(motion, step === 0 ? intent : { ...intent, jump: false }, MOVE_SPEED, map);
  }
}

describe('player motion', () => {
  it('stays on the ground without a jump', () => {
    const map = mapOf('#######', '#P...S#', '#######');
    const motion = motionAt(1.5, 1.5);
    run(motion, map, RUN_RIGHT, 0.5);
    expect(motion.height).toBe(0);
    expect(motion.verticalSpeed).toBe(0);
  });

  it('is stopped by a fence on foot but clears it with a jump', () => {
    const map = mapOf('#########', '#P..F..S#', '#########');
    const walker = motionAt(2.5, 1.5);
    run(walker, map, RUN_RIGHT, 1.5);
    expect(walker.position.x).toBeLessThan(4);
    const jumper = motionAt(3.1, 1.5);
    run(jumper, map, JUMP_RIGHT, 1.5);
    expect(jumper.position.x).toBeGreaterThan(5);
    expect(jumper.height).toBe(0);
  });

  it('never jumps over towering props or the map border', () => {
    const map = mapOf('######', '#P.TS#', '######');
    const motion = motionAt(2.5, 1.5);
    run(motion, map, JUMP_RIGHT, 1.5);
    expect(motion.position.x).toBeLessThan(3);
    const edge = motionAt(4.5, 1.5);
    run(edge, map, JUMP_RIGHT, 1.5);
    expect(edge.position.x).toBeLessThan(5);
  });

  it('lands on top of a coffin and drops off its edge', () => {
    const map = mapOf('#######', '#P.c.S#', '#######');
    const motion = motionAt(3.5, 1.5);
    motion.height = 0.8;
    run(motion, map, STANDING_STILL, 0.6);
    expect(motion.height).toBeCloseTo(0.35);
    expect(motion.verticalSpeed).toBe(0);
    run(motion, map, RUN_RIGHT, 0.6);
    expect(motion.position.x).toBeGreaterThan(4.4);
    expect(motion.height).toBe(0);
  });

  it('jumps only from solid ground', () => {
    const map = mapOf('#######', '#P...S#', '#######');
    const motion = motionAt(2.5, 1.5);
    stepPlayerMotion(motion, JUMP_RIGHT, MOVE_SPEED, map);
    const climbing = motion.verticalSpeed;
    stepPlayerMotion(motion, JUMP_RIGHT, MOVE_SPEED, map);
    expect(motion.verticalSpeed).toBeLessThan(climbing);
  });
});
