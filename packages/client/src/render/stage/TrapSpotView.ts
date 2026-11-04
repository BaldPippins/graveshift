import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Sprite,
  SpriteMaterial,
} from 'three';
import type { Object3D } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { TrapState } from '@graveshift/shared/model';
import { trapPrice } from '@graveshift/shared/rules';
import type { TrapSpot } from '@graveshift/shared/rules';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { cssColor } from '../../content/cssColor.ts';
import { PALETTE } from '../../content/palette.ts';
import { TRAP_CONTENT } from '../../content/trapContent.ts';
import type { TrapFrame } from '../../game/view/WorldFrame.ts';
import type { MerchantSignTexts, TrapSignTexts } from '../../i18n/Messages.ts';
import { createGlowTexture } from '../effects/glowTexture.ts';

const SIGN_HEIGHT = 0.9;
const MARK_HEIGHT = 0.02;
const MARK_INNER = 0.34;
const MARK_OUTER = 0.42;
const PULSE_SPEED = 3;
const FUSE_SIZE = 0.32;
const FUSE_FLICKER_SPEED = 17;

export interface TrapSignSources {
  readonly trap: () => TrapSignTexts;
  readonly prompt: () => MerchantSignTexts;
}

export interface TrapSpotState {
  readonly near: boolean;
  readonly inSight: boolean;
  readonly wave: number;
  readonly deltaSeconds: number;
}

const IDLE_STATE: TrapSpotState = { near: false, inSight: false, wave: 1, deltaSeconds: 0 };

export class TrapSpotView {
  readonly spot: TrapSpot;
  private readonly anchor = new Group();
  private readonly armed: Object3D;
  private readonly sprung: Object3D;
  private readonly mark: Mesh<RingGeometry, MeshBasicMaterial>;
  private readonly fuse: Sprite | null;
  private readonly sign: CSS2DObject;
  private readonly signElement: HTMLDivElement;
  private readonly texts: TrapSignSources;
  private touchPrompts = false;
  private elapsed = 0;
  private pressedPointer: number | null = null;
  private onActivate: () => void = () => undefined;

  constructor(parent: Object3D, assets: AssetLibrary, spot: TrapSpot, texts: TrapSignSources) {
    this.spot = spot;
    this.texts = texts;
    const content = TRAP_CONTENT[spot.kind];
    this.anchor.position.set(spot.center.x, 0, spot.center.y);
    this.armed = assets.instantiate(content.armedModel);
    this.sprung = assets.instantiate(content.sprungModel);
    this.mark = new Mesh(
      new RingGeometry(MARK_INNER, MARK_OUTER, 32),
      new MeshBasicMaterial({
        color: content.markColor,
        transparent: true,
        opacity: 0.5,
        side: DoubleSide,
        depthWrite: false,
      }),
    );
    this.fuse = content.fuseHeight === null ? null : this.createFuse(content.fuseHeight);
    this.mark.rotation.x = -Math.PI / 2;
    this.mark.position.y = MARK_HEIGHT;
    this.signElement = document.createElement('div');
    this.signElement.className = 'merchant-sign trap-sign';
    this.signElement.style.setProperty('--trap-sign', cssColor(PALETTE.trapSign));
    this.signElement.style.setProperty('--trap-sign-text', cssColor(PALETTE.trapSignText));
    this.listenForTaps();
    this.sign = new CSS2DObject(this.signElement);
    this.sign.position.y = SIGN_HEIGHT;
    this.anchor.add(this.mark, this.armed, this.sprung, this.sign);
    if (this.fuse !== null) {
      this.anchor.add(this.fuse);
    }
    parent.add(this.anchor);
    this.sync(undefined, IDLE_STATE);
  }

  onSignActivated(handler: () => void): void {
    this.onActivate = handler;
  }

  setTouchPrompts(enabled: boolean): void {
    this.touchPrompts = enabled;
  }

  setVisible(visible: boolean): void {
    this.anchor.visible = visible;
    this.sign.visible = visible;
  }

  sync(trap: TrapFrame | undefined, state: TrapSpotState): void {
    this.elapsed += state.deltaSeconds;
    const trapState = trap === undefined ? null : trap.state;
    const armed = trapState === TrapState.Armed || trapState === TrapState.Holding;
    this.armed.visible = trapState === TrapState.Armed;
    this.sprung.visible = trapState === TrapState.Holding || trapState === TrapState.Spent;
    this.mark.visible = !armed;
    this.mark.material.opacity = 0.3 + (Math.sin(this.elapsed * PULSE_SPEED) * 0.5 + 0.5) * 0.4;
    if (this.fuse !== null) {
      this.fuse.visible = this.armed.visible;
      const flicker = Math.sin(this.elapsed * FUSE_FLICKER_SPEED) * 0.5 + 0.5;
      this.fuse.scale.setScalar(FUSE_SIZE * (0.7 + flicker * 0.5));
    }
    this.sign.visible = this.anchor.visible && !armed && state.inSight;
    const text = this.signText(state.near, state.wave);
    if (this.signElement.textContent !== text) {
      this.signElement.textContent = text;
    }
    this.signElement.classList.toggle('trap-sign--offer', state.near);
  }

  private createFuse(height: number): Sprite {
    const fuse = new Sprite(
      new SpriteMaterial({
        map: createGlowTexture(),
        color: PALETTE.fuseSpark,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    fuse.position.y = height;
    fuse.scale.setScalar(FUSE_SIZE);
    return fuse;
  }

  private signText(near: boolean, wave: number): string {
    const texts = this.texts.trap();
    const name = texts.names[this.spot.kind];
    const price = trapPrice(this.spot.kind, wave);
    if (!near) {
      return texts.idle(name, price);
    }
    const prompts = this.texts.prompt();
    return texts.offer(name, price, this.touchPrompts ? prompts.tap : prompts.key);
  }

  private listenForTaps(): void {
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
  }
}
