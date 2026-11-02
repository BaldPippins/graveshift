import type { Object3D } from 'three';

export function yawFromAngle(angle: number): number {
  return Math.PI / 2 - angle;
}

export function placeOnGround(object: Object3D, x: number, y: number, height = 0): void {
  object.position.set(x, height, y);
}
