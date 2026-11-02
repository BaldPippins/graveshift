import { exponentialDecayFactor, vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2, Vec2 } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import type { PlayerSnapshot } from '@graveshift/shared/protocol';
import { stepPlayerMovement } from '@graveshift/shared/rules';
import type { MoveIntent } from '@graveshift/shared/rules';
import type { TileMap } from '@graveshift/shared/world';
import type { PendingInput } from './PendingInput.ts';

const ERROR_SMOOTHING_SHARPNESS = 14;
const SNAP_DISTANCE = 2.5;

export class LocalPlayerPredictor {
  private readonly map: TileMap;
  private readonly moveSpeed: number;
  private readonly pending: PendingInput[] = [];
  private readonly predicted: Vec2;
  private readonly visualError = vec2();
  private readonly rendered = vec2();
  private canMove = true;

  constructor(map: TileMap, moveSpeed: number, spawn: ReadonlyVec2) {
    this.map = map;
    this.moveSpeed = moveSpeed;
    this.predicted = vec2(spawn.x, spawn.y);
  }

  get position(): ReadonlyVec2 {
    return this.predicted;
  }

  get renderPosition(): ReadonlyVec2 {
    return this.rendered;
  }

  apply(sequence: number, intent: MoveIntent): void {
    this.pending.push({ sequence, moveX: intent.moveX, moveY: intent.moveY });
    if (this.canMove) {
      stepPlayerMovement(this.predicted, intent, this.moveSpeed, this.map);
    }
  }

  reconcile(authoritative: PlayerSnapshot, locallyPaused: boolean): void {
    const before = vec2(this.predicted.x, this.predicted.y);
    this.canMove = authoritative.life === LifeState.Alive && !locallyPaused;
    const firstUnacknowledged = this.pending.findIndex(
      (input) => input.sequence > authoritative.lastInputSequence,
    );
    this.pending.splice(0, firstUnacknowledged === -1 ? this.pending.length : firstUnacknowledged);
    this.predicted.x = authoritative.x;
    this.predicted.y = authoritative.y;
    if (this.canMove) {
      for (const input of this.pending) {
        stepPlayerMovement(this.predicted, input, this.moveSpeed, this.map);
      }
    }
    const errorX = before.x - this.predicted.x;
    const errorY = before.y - this.predicted.y;
    if (Math.hypot(errorX, errorY) > SNAP_DISTANCE) {
      this.visualError.x = 0;
      this.visualError.y = 0;
      return;
    }
    this.visualError.x += errorX;
    this.visualError.y += errorY;
  }

  updateVisual(deltaSeconds: number): void {
    const decay = 1 - exponentialDecayFactor(ERROR_SMOOTHING_SHARPNESS, deltaSeconds);
    this.visualError.x *= decay;
    this.visualError.y *= decay;
    this.rendered.x = this.predicted.x + this.visualError.x;
    this.rendered.y = this.predicted.y + this.visualError.y;
  }
}
