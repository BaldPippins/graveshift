import { clamp, exponentialDecayFactor, hasFlag, vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { LifeState, PlayerFlag } from '@graveshift/shared/model';
import type { PlayerSnapshot } from '@graveshift/shared/protocol';
import { stepPlayerMotion } from '@graveshift/shared/rules';
import type { MotionIntent, PlayerMotion } from '@graveshift/shared/rules';
import type { TileMap } from '@graveshift/shared/world';
import type { PendingInput } from './PendingInput.ts';

const ERROR_SMOOTHING_SHARPNESS = 14;
const SNAP_DISTANCE = 2.5;

export class LocalPlayerPredictor {
  private readonly map: TileMap;
  private readonly moveSpeed: number;
  private readonly pending: PendingInput[] = [];
  private readonly predicted: PlayerMotion;
  private readonly lastStep = vec2();
  private readonly visualError = vec2();
  private readonly rendered = vec2();
  private lastHeightStep = 0;
  private renderedHeight = 0;
  private canMove = true;

  constructor(map: TileMap, moveSpeed: number, spawn: ReadonlyVec2) {
    this.map = map;
    this.moveSpeed = moveSpeed;
    this.predicted = { position: vec2(spawn.x, spawn.y), height: 0, verticalSpeed: 0 };
  }

  get position(): ReadonlyVec2 {
    return this.predicted.position;
  }

  get height(): number {
    return this.predicted.height;
  }

  get renderPosition(): ReadonlyVec2 {
    return this.rendered;
  }

  get renderHeight(): number {
    return this.renderedHeight;
  }

  apply(sequence: number, intent: MotionIntent): void {
    this.pending.push({ sequence, moveX: intent.moveX, moveY: intent.moveY, jump: intent.jump });
    const position = this.predicted.position;
    const startX = position.x;
    const startY = position.y;
    const startHeight = this.predicted.height;
    if (this.canMove) {
      stepPlayerMotion(this.predicted, intent, this.moveSpeed, this.map);
    }
    this.lastStep.x = position.x - startX;
    this.lastStep.y = position.y - startY;
    this.lastHeightStep = this.predicted.height - startHeight;
  }

  reconcile(authoritative: PlayerSnapshot, locallyPaused: boolean): void {
    const position = this.predicted.position;
    const beforeX = position.x;
    const beforeY = position.y;
    this.canMove =
      authoritative.life === LifeState.Alive &&
      !locallyPaused &&
      !hasFlag(authoritative.flags, PlayerFlag.Snared);
    const firstUnacknowledged = this.pending.findIndex(
      (input) => input.sequence > authoritative.lastInputSequence,
    );
    this.pending.splice(0, firstUnacknowledged === -1 ? this.pending.length : firstUnacknowledged);
    position.x = authoritative.x;
    position.y = authoritative.y;
    this.predicted.height = authoritative.height;
    this.predicted.verticalSpeed = authoritative.verticalSpeed;
    if (this.canMove) {
      for (const input of this.pending) {
        stepPlayerMotion(this.predicted, input, this.moveSpeed, this.map);
      }
    }
    const errorX = beforeX - position.x;
    const errorY = beforeY - position.y;
    if (Math.hypot(errorX, errorY) > SNAP_DISTANCE) {
      this.visualError.x = 0;
      this.visualError.y = 0;
      return;
    }
    this.visualError.x += errorX;
    this.visualError.y += errorY;
  }

  updateVisual(deltaSeconds: number, stepProgress: number): void {
    const decay = 1 - exponentialDecayFactor(ERROR_SMOOTHING_SHARPNESS, deltaSeconds);
    this.visualError.x *= decay;
    this.visualError.y *= decay;
    const lag = 1 - clamp(stepProgress, 0, 1);
    const position = this.predicted.position;
    this.rendered.x = position.x - this.lastStep.x * lag + this.visualError.x;
    this.rendered.y = position.y - this.lastStep.y * lag + this.visualError.y;
    this.renderedHeight = Math.max(0, this.predicted.height - this.lastHeightStep * lag);
  }
}
