import type { Object3D } from 'three';

export interface EntityView<TFrame> {
  readonly object: Object3D;
  sync(frame: TFrame, deltaSeconds: number): void;
  retire(): void;
  updateRetired(deltaSeconds: number): boolean;
  dispose(): void;
}
