import { Group, Matrix4 } from 'three';
import type { Object3D } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { MELEE_WEAPONS } from '@graveshift/shared/config';
import type { MeleeWeaponId, RangedWeaponId } from '@graveshift/shared/config';
import { exponentialDecayFactor, lerpAngle, hasBit } from '@graveshift/shared/core';
import { LifeState, PlayerFlag } from '@graveshift/shared/model';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { weaponModelKey } from '../../assets/ModelKey.ts';
import type { ModelKey } from '../../assets/ModelKey.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import type { PlayerFrame } from '../../game/view/WorldFrame.ts';
import { bonePoseMatrix } from '../characters/bonePose.ts';
import { AnimationName, ARM_TRACK_PREFIX } from '../characters/clipTools.ts';
import type { CharacterRig } from '../characters/CharacterRig.ts';
import { createCharacterRig } from '../characters/createCharacterRig.ts';
import { placeOnGround, yawFromAngle } from '../space.ts';
import type { EntityView } from './EntityView.ts';
import { HealthBar } from './HealthBar.ts';
import { MeleeWeaponView } from './MeleeWeaponView.ts';
import { PLAYER_HEALTH_BAR } from './HealthBarStyle.ts';
import { ProgressRing } from './ProgressRing.ts';
import { PALETTE } from '../../content/palette.ts';
import { playerStatusIcon } from '../../content/playerStatusContent.ts';

const LABEL_HEIGHT = 1.5;
const HEALTH_BAR_HEIGHT = 1.08;
const TURN_SHARPNESS = 22;
const WEAPON_BONE = ARM_TRACK_PREFIX.slice(0, -1);
const WEAPON_GRIP = new Matrix4().makeTranslation(-0.15, 0.34, 0.26);
const STRIKE_CLIP_SECONDS = 0.417;
const STRIKE_SPEEDUP = 1.1;
const AIRBORNE_HEIGHT = 0.03;

export class PlayerView implements EntityView<PlayerFrame> {
  readonly object = new Group();
  private readonly assets: AssetLibrary;
  private readonly heroModel: ModelKey;
  private readonly rig: CharacterRig;
  private readonly reviveRing: ProgressRing;
  private readonly footRing: ProgressRing;
  private readonly healthBar = new HealthBar(HEALTH_BAR_HEIGHT, PLAYER_HEALTH_BAR);
  private readonly label: CSS2DObject;
  private readonly labelElement: HTMLDivElement;
  private readonly melee: MeleeWeaponView;
  private weaponModel: Object3D | null = null;
  private weapon: RangedWeaponId | null = null;
  private strikeSecondsLeft = 0;
  private yaw = 0;

  constructor(frame: PlayerFrame, assets: AssetLibrary) {
    this.assets = assets;
    const content = HERO_CONTENT[frame.hero];
    this.heroModel = content.model;
    this.rig = createCharacterRig(assets, content.model);
    this.melee = new MeleeWeaponView(assets, content.model, this.rig);
    this.object.add(this.rig.root);

    this.footRing = new ProgressRing(Number.parseInt(content.color.slice(1), 16));
    this.footRing.setProgress(1);
    this.footRing.mesh.material.opacity = frame.isLocal ? 0.85 : 0.45;
    this.reviveRing = new ProgressRing(PALETTE.reviveGreen);
    this.reviveRing.mesh.scale.setScalar(1.5);
    this.object.add(this.footRing.mesh, this.reviveRing.mesh, this.healthBar.object);

    this.labelElement = document.createElement('div');
    this.labelElement.className = frame.isLocal
      ? 'player-label player-label--local'
      : 'player-label';
    this.labelElement.style.setProperty('--hero-color', content.color);
    this.label = new CSS2DObject(this.labelElement);
    this.label.position.y = LABEL_HEIGHT;
    this.object.add(this.label);
    this.yaw = yawFromAngle(frame.aim);
  }

  sync(frame: PlayerFrame, deltaSeconds: number): void {
    placeOnGround(this.object, frame.x, frame.y, frame.height);
    this.footRing.keepOnGround(frame.height);
    this.yaw = lerpAngle(
      this.yaw,
      yawFromAngle(frame.aim),
      exponentialDecayFactor(TURN_SHARPNESS, deltaSeconds),
    );
    this.rig.root.rotation.y = this.yaw;
    this.equip(frame.weapon);
    this.melee.equip(frame.melee);
    this.melee.updateGlow(frame.furyProgress > 0 && frame.life === LifeState.Alive, deltaSeconds);
    this.strikeSecondsLeft = Math.max(0, this.strikeSecondsLeft - deltaSeconds);
    this.animate(frame);
    this.reviveRing.setProgress(frame.life === LifeState.Downed ? frame.reviveProgress : 0);
    this.footRing.mesh.visible = frame.life === LifeState.Alive;
    this.healthBar.setFraction(frame.life === LifeState.Alive ? frame.healthFraction : 0);
    this.object.visible = frame.life !== LifeState.Dead;
    this.updateLabel(frame);
    this.rig.update(deltaSeconds);
  }

  strike(weapon: MeleeWeaponId): void {
    const timeScale = Math.max(
      1,
      (STRIKE_CLIP_SECONDS / MELEE_WEAPONS[weapon].stats.swingSeconds) * STRIKE_SPEEDUP,
    );
    this.strikeSecondsLeft = STRIKE_CLIP_SECONDS / timeScale;
    this.rig.playLeftOverlay(AnimationName.StrikeLeft, { once: true, timeScale });
  }

  retire(): void {
    this.object.visible = false;
  }

  updateRetired(): boolean {
    return false;
  }

  dispose(): void {
    this.melee.dispose();
    this.rig.dispose();
    this.reviveRing.dispose();
    this.footRing.dispose();
    this.healthBar.dispose();
    this.label.removeFromParent();
    this.labelElement.remove();
    this.object.removeFromParent();
  }

  private animate(frame: PlayerFrame): void {
    if (frame.life !== LifeState.Alive) {
      this.rig.playBase(AnimationName.Die, { once: true });
      this.rig.playOverlay(null);
      this.rig.playLeftOverlay(null);
      return;
    }
    if (hasBit(frame.flags, PlayerFlag.Paused) || hasBit(frame.flags, PlayerFlag.Disconnected)) {
      this.rig.playBase(AnimationName.Sit, { once: true });
      this.rig.playOverlay(null);
      this.rig.playLeftOverlay(null);
      return;
    }
    if (frame.height > AIRBORNE_HEIGHT) {
      this.rig.playBase(AnimationName.Jump, { bodyOnly: true, once: true });
    } else {
      this.rig.playBase(frame.moving ? AnimationName.Walk : AnimationName.Idle, {
        bodyOnly: true,
        timeScale: 1.3,
      });
    }
    if (this.strikeSecondsLeft <= 0) {
      this.rig.playLeftOverlay(AnimationName.HoldLeft);
    }
    this.rig.playOverlay(
      hasBit(frame.flags, PlayerFlag.Firing) ? AnimationName.ShootRight : AnimationName.HoldRight,
    );
  }

  private equip(weapon: RangedWeaponId): void {
    if (weapon === this.weapon) {
      return;
    }
    this.weapon = weapon;
    if (this.weaponModel !== null) {
      this.weaponModel.removeFromParent();
    }
    const model = this.assets.instantiate(weaponModelKey(weapon));
    const holdPose = bonePoseMatrix(
      this.assets,
      this.heroModel,
      AnimationName.HoldRight,
      WEAPON_BONE,
    );
    this.weaponModel = this.rig.attachAtPose(model, WEAPON_BONE, WEAPON_GRIP, holdPose)
      ? model
      : null;
  }

  private updateLabel(frame: PlayerFrame): void {
    const marker = playerStatusIcon(frame.life, frame.flags);
    const text = marker === '' ? frame.nickname : `${marker} ${frame.nickname}`;
    if (this.labelElement.textContent !== text) {
      this.labelElement.textContent = text;
    }
    this.labelElement.classList.toggle(
      'player-label--offline',
      hasBit(frame.flags, PlayerFlag.Disconnected),
    );
  }
}
