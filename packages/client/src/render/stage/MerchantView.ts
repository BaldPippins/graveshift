import { Group } from 'three';
import type { Object3D } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { angleBetween, exponentialDecayFactor, lerpAngle } from '@graveshift/shared/core';
import { MERCHANT_RULES } from '@graveshift/shared/config';
import { isMerchantPresent } from '@graveshift/shared/rules';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { ModelKey } from '../../assets/ModelKey.ts';
import type { MerchantFrame } from '../../game/view/WorldFrame.ts';
import type { MerchantSignTexts } from '../../i18n/Messages.ts';
import { AnimationName } from '../characters/clipTools.ts';
import type { CharacterRig } from '../characters/CharacterRig.ts';
import { createCharacterRig } from '../characters/createCharacterRig.ts';
import { yawFromAngle } from '../space.ts';
import { HealthBar } from '../views/HealthBar.ts';
import { MERCHANT_HEALTH_BAR } from '../views/HealthBarStyle.ts';

const SIGN_HEIGHT = 1.85;
const HEALTH_BAR_HEIGHT = 1.35;
const GRAVE_SIGN_HEIGHT = 1.25;
const GRAVE_SCALE = 1.4;
const TURN_SHARPNESS = 10;

export class MerchantView {
  private readonly anchor = new Group();
  private readonly home: ReadonlyVec2;
  private readonly rig: CharacterRig;
  private readonly grave: Object3D;
  private readonly healthBar = new HealthBar(HEALTH_BAR_HEIGHT, MERCHANT_HEALTH_BAR);
  private readonly sign: CSS2DObject;
  private readonly signElement: HTMLDivElement;
  private readonly signTexts: () => MerchantSignTexts;
  private serving = false;
  private pose: AnimationName = AnimationName.Idle;
  private yaw: number;
  private touchPrompts = false;
  private pressedPointer: number | null = null;
  private onActivate: () => void = () => undefined;

  constructor(
    parent: Object3D,
    assets: AssetLibrary,
    position: ReadonlyVec2,
    lookAt: ReadonlyVec2,
    signTexts: () => MerchantSignTexts,
  ) {
    this.signTexts = signTexts;
    this.home = position;
    this.rig = createCharacterRig(assets, ModelKey.Keeper);
    this.anchor.position.set(position.x, 0, position.y);
    this.yaw = yawFromAngle(angleBetween(position, lookAt));
    this.rig.root.rotation.y = this.yaw;
    this.grave = assets.instantiate(ModelKey.GraveCross);
    this.grave.scale.multiplyScalar(GRAVE_SCALE);
    this.grave.rotation.y = this.rig.root.rotation.y;
    this.grave.visible = false;
    this.anchor.add(this.rig.root, this.healthBar.object, this.grave);
    this.rig.playBase(AnimationName.Idle);
    this.signElement = document.createElement('div');
    this.signElement.className = 'merchant-sign';
    this.signElement.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
      this.pressedPointer = event.pointerId;
    });
    this.signElement.addEventListener('pointerup', (event) => {
      const pressedHere = this.pressedPointer === event.pointerId;
      this.pressedPointer = null;
      if (pressedHere) {
        this.onActivate();
      }
    });
    this.signElement.addEventListener('pointerleave', () => {
      this.pressedPointer = null;
    });
    this.sign = new CSS2DObject(this.signElement);
    this.sign.position.y = SIGN_HEIGHT;
    this.anchor.add(this.sign);
    parent.add(this.anchor);
  }

  get position(): ReadonlyVec2 {
    return { x: this.anchor.position.x, y: this.anchor.position.z };
  }

  onSignActivated(handler: () => void): void {
    this.onActivate = handler;
  }

  setTouchPrompts(enabled: boolean): void {
    this.touchPrompts = enabled;
  }

  setVisible(visible: boolean): void {
    this.sign.visible = visible;
  }

  sync(frame: MerchantFrame | null, nearby: boolean, deltaSeconds: number): void {
    const alive = frame === null || isMerchantPresent(frame);
    if (frame === null) {
      this.anchor.position.set(this.home.x, 0, this.home.y);
    } else {
      this.walkTo(frame, deltaSeconds);
    }
    this.rig.root.visible = alive;
    this.grave.visible = !alive;
    this.sign.position.y = alive ? SIGN_HEIGHT : GRAVE_SIGN_HEIGHT;
    this.healthBar.setFraction(alive && frame !== null ? frame.healthFraction : 0);
    this.setServing(alive && nearby);
    this.playPose(this.poseFor(frame, alive));
    const texts = this.signTexts();
    const text = alive
      ? this.openSign(texts)
      : this.graveSign(texts, frame.wavesUntilReturn, nearby);
    if (this.signElement.textContent !== text) {
      this.signElement.textContent = text;
    }
    this.signElement.classList.toggle('merchant-sign--closed', !alive && !nearby);
    this.signElement.classList.toggle('merchant-sign--revive', !alive && nearby);
  }

  private graveSign(texts: MerchantSignTexts, wavesUntilReturn: number, nearby: boolean): string {
    return nearby
      ? texts.revive(MERCHANT_RULES.revivePrice, this.prompt(texts))
      : texts.grave(wavesUntilReturn, MERCHANT_RULES.revivePrice);
  }

  update(deltaSeconds: number): void {
    this.rig.update(deltaSeconds);
  }

  private openSign(texts: MerchantSignTexts): string {
    return this.serving ? texts.serving(this.prompt(texts)) : texts.idle;
  }

  private prompt(texts: MerchantSignTexts): string {
    return this.touchPrompts ? texts.tap : texts.key;
  }

  private setServing(serving: boolean): void {
    if (serving === this.serving) {
      return;
    }
    this.serving = serving;
    this.signElement.classList.toggle('merchant-sign--serving', serving);
  }

  private walkTo(frame: MerchantFrame, deltaSeconds: number): void {
    const dx = frame.x - this.anchor.position.x;
    const dz = frame.y - this.anchor.position.z;
    this.anchor.position.set(frame.x, 0, frame.y);
    if (frame.moving && (dx !== 0 || dz !== 0)) {
      this.yaw = lerpAngle(
        this.yaw,
        yawFromAngle(Math.atan2(dz, dx)),
        exponentialDecayFactor(TURN_SHARPNESS, deltaSeconds),
      );
      this.rig.root.rotation.y = this.yaw;
    }
  }

  private poseFor(frame: MerchantFrame | null, alive: boolean): AnimationName {
    if (alive && frame !== null && frame.moving) {
      return AnimationName.Walk;
    }
    return this.serving ? AnimationName.Interact : AnimationName.Idle;
  }

  private playPose(pose: AnimationName): void {
    if (pose !== this.pose) {
      this.pose = pose;
      this.rig.playBase(pose);
    }
  }
}
