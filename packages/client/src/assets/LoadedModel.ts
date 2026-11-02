import type { AnimationClip, Object3D } from 'three';

export interface LoadedModel {
  readonly root: Object3D;
  readonly clips: readonly AnimationClip[];
}
