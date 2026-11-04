import { Color, Matrix4, MeshStandardMaterial } from 'three';
import type { Material, Object3D } from 'three';
import type { MeleeWeaponId } from '@graveshift/shared/config';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { isMesh, replaceMeshMaterials } from '../../assets/meshMaterials.ts';
import { weaponModelKey } from '../../assets/ModelKey.ts';
import type { ModelKey } from '../../assets/ModelKey.ts';
import { FURY_COLOR, WEAPON_CONTENT } from '../../content/weaponContent.ts';
import { bonePoseMatrix } from '../characters/bonePose.ts';
import { AnimationName, LEFT_ARM_TRACK_PREFIX } from '../characters/clipTools.ts';
import type { CharacterRig } from '../characters/CharacterRig.ts';

const HAND_BONE = LEFT_ARM_TRACK_PREFIX.slice(0, -1);
const HAND_OFFSET = new Matrix4().makeTranslation(0.15, 0.34, 0.24);
const BLADE_TILT_RADIANS = 1.05;
const GLOW_PULSE_RATE = 11;
const GLOW_BASE = 0.75;
const GLOW_SWING = 0.45;
const BLACK = new Color(0x000000);
const FURY = new Color(FURY_COLOR);

export class MeleeWeaponView {
  private readonly assets: AssetLibrary;
  private readonly heroModel: ModelKey;
  private readonly rig: CharacterRig;
  private readonly materials: MeshStandardMaterial[] = [];
  private model: Object3D | null = null;
  private weapon: MeleeWeaponId | null = null;
  private glowSeconds = 0;
  private glowing = false;

  constructor(assets: AssetLibrary, heroModel: ModelKey, rig: CharacterRig) {
    this.assets = assets;
    this.heroModel = heroModel;
    this.rig = rig;
  }

  equip(weapon: MeleeWeaponId): void {
    if (weapon === this.weapon) {
      return;
    }
    this.weapon = weapon;
    this.detach();
    const model = this.assets.instantiate(weaponModelKey(weapon));
    this.cloneMaterials(model);
    const content = WEAPON_CONTENT[weapon];
    const grip = new Matrix4()
      .copy(HAND_OFFSET)
      .multiply(new Matrix4().makeRotationX(BLADE_TILT_RADIANS + (content.headDown ? Math.PI : 0)))
      .multiply(new Matrix4().makeTranslation(0, -content.model.size * content.gripFraction, 0));
    const pose = bonePoseMatrix(this.assets, this.heroModel, AnimationName.HoldLeft, HAND_BONE);
    this.model = this.rig.attachAtPose(model, HAND_BONE, grip, pose) ? model : null;
    this.glowing = false;
  }

  updateGlow(furious: boolean, deltaSeconds: number): void {
    if (!furious && !this.glowing) {
      return;
    }
    this.glowing = furious;
    this.glowSeconds += deltaSeconds;
    const pulse = GLOW_BASE + GLOW_SWING * Math.sin(this.glowSeconds * GLOW_PULSE_RATE);
    for (const material of this.materials) {
      if (furious) {
        material.emissive.copy(FURY);
        material.emissiveIntensity = pulse;
      } else {
        material.emissive.copy(BLACK);
        material.emissiveIntensity = 1;
      }
    }
  }

  dispose(): void {
    this.detach();
  }

  private detach(): void {
    if (this.model !== null) {
      this.model.removeFromParent();
      this.model = null;
    }
    for (const material of this.materials) {
      material.dispose();
    }
    this.materials.length = 0;
  }

  private cloneMaterials(model: Object3D): void {
    model.traverse((child) => {
      if (!isMesh(child)) {
        return;
      }
      replaceMeshMaterials(child, (material: Material) => {
        const copy = material.clone();
        if (copy instanceof MeshStandardMaterial) {
          this.materials.push(copy);
        }
        return copy;
      });
    });
  }
}
