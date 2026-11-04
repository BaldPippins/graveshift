import type { Object3D } from 'three';

export interface DamageMarker {
  readonly object: Object3D;
  setHealth(fraction: number): void;
  update(deltaSeconds: number): void;
  dispose(): void;
}
