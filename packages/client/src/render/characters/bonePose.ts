import { AnimationMixer, Matrix4 } from 'three';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import type { ModelKey } from '../../assets/ModelKey.ts';
import { splitClips } from './clipTools.ts';

const POSES = new Map<string, Matrix4>();

export function bonePoseMatrix(
  assets: AssetLibrary,
  model: ModelKey,
  clipName: string,
  boneName: string,
): Matrix4 {
  const key = `${model}|${clipName}|${boneName}`;
  const cached = POSES.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const instance = assets.instantiate(model);
  const clip = splitClips(assets.clips(model)).get(clipName);
  if (clip !== undefined) {
    const mixer = new AnimationMixer(instance);
    mixer.clipAction(clip).play();
    mixer.update(0);
  }
  instance.updateMatrixWorld(true);
  const bone = instance.getObjectByName(boneName);
  const pose = bone === undefined ? new Matrix4() : bone.matrixWorld.clone();
  POSES.set(key, pose);
  return pose;
}
