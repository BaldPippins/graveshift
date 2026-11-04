import { JUMP_RULES } from '../config/jump.ts';
import { SIMULATION } from '../config/simulation.ts';
import { PLAYER_RULES } from '../config/player.ts';
import { lengthOf } from '../core/vectorMath.ts';
import type { Vec2 } from '../core/Vec2.ts';
import { groundHeightUnder, moveCircle } from '../world/circleCollision.ts';
import { CollisionLayer } from '../world/CollisionLayer.ts';
import type { TileMap } from '../world/TileMap.ts';

export interface MoveIntent {
  readonly moveX: number;
  readonly moveY: number;
}

export interface MotionIntent extends MoveIntent {
  readonly jump: boolean;
}

export interface PlayerMotion {
  readonly position: Vec2;
  height: number;
  verticalSpeed: number;
}

export const STANDING_STILL: MotionIntent = { moveX: 0, moveY: 0, jump: false };

export function stepPlayerMovement(
  position: Vec2,
  intent: MoveIntent,
  moveSpeed: number,
  map: TileMap,
  clearance = 0,
): void {
  const magnitude = lengthOf(intent.moveX, intent.moveY);
  if (magnitude === 0) {
    return;
  }
  const scale = (Math.min(1, magnitude) / magnitude) * moveSpeed * SIMULATION.tickSeconds;
  moveCircle(
    position,
    intent.moveX * scale,
    intent.moveY * scale,
    PLAYER_RULES.radius,
    map,
    CollisionLayer.Movement,
    clearance,
  );
  position.x = Math.fround(position.x);
  position.y = Math.fround(position.y);
}

export function motionClearance(height: number): number {
  return Math.max(0, height) + JUMP_RULES.stepClearance;
}

export function isGrounded(motion: PlayerMotion): boolean {
  return motion.verticalSpeed === 0;
}

export function stepPlayerMotion(
  motion: PlayerMotion,
  intent: MotionIntent,
  moveSpeed: number,
  map: TileMap,
): void {
  if (intent.jump && isGrounded(motion)) {
    motion.verticalSpeed = JUMP_RULES.launchSpeed;
  }
  const startHeight = motion.height;
  motion.verticalSpeed -= JUMP_RULES.gravity * SIMULATION.tickSeconds;
  motion.height += motion.verticalSpeed * SIMULATION.tickSeconds;
  const clearance = motionClearance(Math.max(startHeight, motion.height));
  stepPlayerMovement(motion.position, intent, moveSpeed, map, clearance);
  const ground = groundHeightUnder(motion.position, PLAYER_RULES.radius, map, clearance);
  if (motion.height <= ground) {
    motion.height = ground;
    motion.verticalSpeed = 0;
  }
  motion.height = Math.fround(motion.height);
  motion.verticalSpeed = Math.fround(motion.verticalSpeed);
}

export function resetMotion(motion: PlayerMotion): void {
  motion.height = 0;
  motion.verticalSpeed = 0;
}
