import { angleBetween, distance, vec2, wrapAngle } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { motionClearance } from '@graveshift/shared/rules';
import { CollisionLayer, hasLineOfSight } from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import type { AimAssist } from '../../input/AimAssist.ts';

const ASSIST_CONE_RADIANS = 0.26;
const ASSIST_RANGE = 10;

export class TargetAimAssist implements AimAssist {
  private readonly map: TileMap;
  private readonly origin = vec2();
  private targets: readonly ReadonlyVec2[] = [];
  private clearance = 0;

  constructor(map: TileMap) {
    this.map = map;
  }

  setTargets(targets: readonly ReadonlyVec2[]): void {
    this.targets = targets;
  }

  refine(originX: number, originY: number, height: number, angle: number): number {
    this.origin.x = originX;
    this.origin.y = originY;
    this.clearance = motionClearance(height);
    let refined = angle;
    let closestOffset = ASSIST_CONE_RADIANS;
    for (const target of this.targets) {
      const toward = angleBetween(this.origin, target);
      const offset = Math.abs(wrapAngle(toward - angle));
      if (offset < closestOffset && this.isReachable(target)) {
        refined = toward;
        closestOffset = offset;
      }
    }
    return refined;
  }

  private isReachable(target: ReadonlyVec2): boolean {
    return (
      distance(this.origin, target) <= ASSIST_RANGE &&
      hasLineOfSight(this.map, this.origin, target, CollisionLayer.Projectiles, this.clearance)
    );
  }
}
