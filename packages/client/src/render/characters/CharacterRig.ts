import { AnimationMixer, Color, Group, LoopOnce, LoopRepeat, MeshStandardMaterial } from 'three';
import type { AnimationAction, AnimationClip, Material, Matrix4, Object3D } from 'three';
import { isMesh, replaceMeshMaterials } from '../../assets/meshMaterials.ts';
import { ARM_SUFFIX, BODY_SUFFIX, LEFT_ARM_SUFFIX, splitClips } from './clipTools.ts';
import type { PlaybackOptions } from './PlaybackOptions.ts';

const DEFAULT_FADE_SECONDS = 0.18;
const FLASH_SECONDS = 0.12;
const FLASH_COLOR = new Color(0xffffff);
const BLACK = new Color(0x000000);

function cloneMaterials(model: Object3D): MeshStandardMaterial[] {
  const cloned: MeshStandardMaterial[] = [];
  model.traverse((child) => {
    if (!isMesh(child)) {
      return;
    }
    replaceMeshMaterials(child, (material: Material) => {
      const copy = material.clone();
      if (copy instanceof MeshStandardMaterial) {
        cloned.push(copy);
      }
      return copy;
    });
  });
  return cloned;
}

export class CharacterRig {
  readonly root = new Group();
  private readonly model: Object3D;
  private readonly mixer: AnimationMixer;
  private readonly clips: ReadonlyMap<string, AnimationClip>;
  private readonly actions = new Map<string, AnimationAction>();
  private readonly materials: MeshStandardMaterial[];
  private base: AnimationAction | null = null;
  private overlay: AnimationAction | null = null;
  private leftOverlay: AnimationAction | null = null;
  private flashRemaining = 0;

  constructor(model: Object3D, clips: readonly AnimationClip[]) {
    this.model = model;
    this.root.add(model);
    this.mixer = new AnimationMixer(model);
    this.materials = cloneMaterials(model);
    this.clips = splitClips(clips);
  }

  playBase(name: string, options: PlaybackOptions = {}): void {
    const clipName = options.bodyOnly === true ? name + BODY_SUFFIX : name;
    const next = this.actionFor(clipName);
    if (next === undefined) {
      return;
    }
    next.timeScale = options.timeScale ?? 1;
    if (next === this.base) {
      return;
    }
    this.configureLoop(next, options.once === true);
    next.reset().play();
    if (this.base !== null) {
      next.crossFadeFrom(this.base, DEFAULT_FADE_SECONDS, false);
    }
    this.base = next;
  }

  playOverlay(name: string | null): void {
    const next = name === null ? undefined : this.actionFor(name + ARM_SUFFIX);
    if (next === this.overlay || (next === undefined && this.overlay === null)) {
      return;
    }
    if (this.overlay !== null) {
      this.overlay.fadeOut(DEFAULT_FADE_SECONDS);
    }
    this.overlay = next ?? null;
    if (next !== undefined) {
      this.configureLoop(next, false);
      next.reset().fadeIn(DEFAULT_FADE_SECONDS).play();
    }
  }

  playLeftOverlay(name: string | null, options: PlaybackOptions = {}): void {
    const next = name === null ? undefined : this.actionFor(name + LEFT_ARM_SUFFIX);
    const once = options.once === true;
    if (next !== undefined) {
      next.timeScale = options.timeScale ?? 1;
    }
    if (next === this.leftOverlay && !once) {
      return;
    }
    if (next === undefined && this.leftOverlay === null) {
      return;
    }
    if (this.leftOverlay !== null && this.leftOverlay !== next) {
      this.leftOverlay.fadeOut(DEFAULT_FADE_SECONDS);
    }
    this.leftOverlay = next ?? null;
    if (next !== undefined) {
      this.configureLoop(next, once);
      next.reset().setEffectiveWeight(1).play();
    }
  }

  attachAtPose(
    object: Object3D,
    nodeName: string,
    rootTransform: Matrix4,
    bonePose: Matrix4,
  ): boolean {
    const node = this.model.getObjectByName(nodeName);
    if (node === undefined) {
      return false;
    }
    bonePose
      .clone()
      .invert()
      .multiply(rootTransform)
      .decompose(object.position, object.quaternion, object.scale);
    node.add(object);
    return true;
  }

  durationOf(name: string): number {
    const clip = this.clips.get(name);
    return clip === undefined ? 0 : clip.duration;
  }

  flash(): void {
    this.flashRemaining = FLASH_SECONDS;
  }

  setOpacity(opacity: number): void {
    for (const material of this.materials) {
      material.transparent = opacity < 1;
      material.opacity = opacity;
      material.depthWrite = opacity >= 1;
    }
  }

  update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
    if (this.flashRemaining > 0) {
      this.flashRemaining = Math.max(0, this.flashRemaining - deltaSeconds);
      const intensity = this.flashRemaining / FLASH_SECONDS;
      for (const material of this.materials) {
        material.emissive.copy(BLACK).lerp(FLASH_COLOR, intensity * 0.8);
      }
    }
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    for (const material of this.materials) {
      material.dispose();
    }
    this.root.removeFromParent();
  }

  private actionFor(clipName: string): AnimationAction | undefined {
    const cached = this.actions.get(clipName);
    if (cached !== undefined) {
      return cached;
    }
    const clip = this.clips.get(clipName);
    if (clip === undefined) {
      return undefined;
    }
    const action = this.mixer.clipAction(clip);
    this.actions.set(clipName, action);
    return action;
  }

  private configureLoop(action: AnimationAction, once: boolean): void {
    action.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Number.POSITIVE_INFINITY);
    action.clampWhenFinished = once;
  }
}
