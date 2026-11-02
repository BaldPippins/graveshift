import { SIMULATION } from '../config/simulation.ts';
import { PLAYER_RULES } from '../config/player.ts';
import { lengthOf } from '../core/vectorMath.ts';
import type { Vec2 } from '../core/Vec2.ts';
import { moveCircle } from '../world/circleCollision.ts';
import { CollisionLayer } from '../world/CollisionLayer.ts';
import type { TileMap } from '../world/TileMap.ts';

export interface MoveIntent {
  readonly moveX: number;
  readonly moveY: number;
}

export function stepPlayerMovement(
  position: Vec2,
  intent: MoveIntent,
  moveSpeed: number,
  map: TileMap,
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
  );
  position.x = Math.fround(position.x);
  position.y = Math.fround(position.y);
}
