import { Color, Matrix4 } from 'three';
import type { Object3D, Texture } from 'three';
import type { MeleeWeaponId } from '@graveshift/shared/config';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { weaponModelKey } from '../../assets/ModelKey.ts';
import type { ModelKey } from '../../assets/ModelKey.ts';
import { FURY_COLOR, WEAPON_CONTENT } from '../../content/weaponContent.ts';
import { bonePoseMatrix } from '../characters/bonePose.ts';
import { AnimationName, LEFT_ARM_TRACK_PREFIX } from '../characters/clipTools.ts';
import type { CharacterRig } from '../characters/CharacterRig.ts';
import { WeaponFinish } from './WeaponFinish.ts';

const HAND_BONE = LEFT_ARM_TRACK_PREFIX.slice(0, -1);
const HAND_OFFSET = new Matrix4().makeTranslation(0.15, 0.34, 0.24);
const BLADE_TILT_RADIANS = 1.05;
const GLOW_PULSE_RATE = 11;
const GLOW_BASE = 0.75;
const GLOW_SWING = 0.45;
const FURY = new Color(FURY_COLOR);

export class MeleeWeaponView {
  private readonly assets: AssetLibrary;
  private readonly heroModel: ModelKey;
  private readonly rig: CharacterRig;
  private finish: WeaponFinish | null = null;
  private model: Object3D | null = null;
  private weapon: MeleeWeaponId | null = null;
  private glowSeconds = 0;

  private readonly glow: Texture;

  constructor(assets: AssetLibrary, heroModel: ModelKey, rig: CharacterRig, glow: Texture) {
    this.glow = glow;
    this.assets = assets;
    this.heroModel = heroModel;
    this.rig = rig;
  }

  equip(weapon: MeleeWeaponId | null): void {
    if (weapon === this.weapon) {
      return;
    }
    this.weapon = weapon;
    this.detach();
    if (weapon === null) {
      return;
    }
    const model = this.assets.instantiate(weaponModelKey(weapon));
    const content = WEAPON_CONTENT[weapon];
    this.finish = new WeaponFinish(model, content.color, this.glow);
    const grip = new Matrix4()
      .copy(HAND_OFFSET)
      .multiply(new Matrix4().makeRotationX(BLADE_TILT_RADIANS + (content.headDown ? Math.PI : 0)))
      .multiply(new Matrix4().makeTranslation(0, -content.model.size * content.gripFraction, 0));
    const pose = bonePoseMatrix(this.assets, this.heroModel, AnimationName.HoldLeft, HAND_BONE);
    this.model = this.rig.attachAtPose(model, HAND_BONE, grip, pose) ? model : null;
  }

  setGrade(grade: number): void {
    if (this.finish !== null) {
      this.finish.setGrade(grade);
    }
  }

  updateGlow(furious: boolean, deltaSeconds: number): void {
    const finish = this.finish;
    if (finish === null) {
      return;
    }
    this.glowSeconds += deltaSeconds;
    if (!furious) {
      finish.glow(deltaSeconds);
      return;
    }
    finish.shine(FURY, GLOW_BASE + GLOW_SWING * Math.sin(this.glowSeconds * GLOW_PULSE_RATE));
  }

  dispose(): void {
    this.detach();
  }

  private detach(): void {
    if (this.model !== null) {
      this.model.removeFromParent();
      this.model = null;
    }
    if (this.finish !== null) {
      this.finish.dispose();
      this.finish = null;
    }
  }
}
