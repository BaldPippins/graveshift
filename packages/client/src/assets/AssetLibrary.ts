import { LoadingManager } from 'three';
import type { AnimationClip, Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import type { LoadedModel } from './LoadedModel.ts';
import type { ModelKey } from './ModelKey.ts';
import { MODEL_MANIFEST } from './modelManifest.ts';
import { normalizeModel } from './normalizeModel.ts';

export class AssetLibrary {
  private readonly models = new Map<ModelKey, LoadedModel>();

  async loadAll(onProgress: (fraction: number) => void): Promise<void> {
    const manager = new LoadingManager();
    manager.onProgress = (_url, loaded, total) => {
      onProgress(total === 0 ? 0 : loaded / total);
    };
    const loader = new GLTFLoader(manager);
    const entries = Object.entries(MODEL_MANIFEST) as [
      ModelKey,
      (typeof MODEL_MANIFEST)[ModelKey],
    ][];
    await Promise.all(
      entries.map(async ([key, spec]) => {
        const gltf = await loader.loadAsync(spec.url);
        this.models.set(key, { root: normalizeModel(gltf.scene, spec), clips: gltf.animations });
      }),
    );
    onProgress(1);
  }

  prototype(key: ModelKey): Object3D {
    return this.require(key).root;
  }

  instantiate(key: ModelKey): Object3D {
    return cloneSkinned(this.require(key).root);
  }

  clips(key: ModelKey): readonly AnimationClip[] {
    return this.require(key).clips;
  }

  private require(key: ModelKey): LoadedModel {
    const model = this.models.get(key);
    if (model === undefined) {
      throw new Error(`Model "${key}" is not loaded`);
    }
    return model;
  }
}
