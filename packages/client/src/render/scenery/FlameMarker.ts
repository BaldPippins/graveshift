import { AdditiveBlending, Group, NormalBlending, Sprite, SpriteMaterial } from 'three';
import type { Texture } from 'three';
import { PALETTE } from '../../content/palette.ts';
import type { DamageMarker } from './DamageMarker.ts';

interface Flame {
  readonly sprite: Sprite;
  readonly baseHeight: number;
  readonly phase: number;
  readonly ember: boolean;
}

const FLAME_COLORS: readonly number[] = [
  PALETTE.flameDeep,
  PALETTE.flameRed,
  PALETTE.flameScarlet,
  PALETTE.flameOrange,
];
const EMBER_COLOR = PALETTE.ember;
const FLAMES = 8;
const EMBERS = 6;
const SPREAD = 0.4;
const EMBER_RISE = 1.4;
const FLICKER_SPEED = 13;
const FLAME_RENDER_ORDER = 2;

export class FlameMarker implements DamageMarker {
  readonly object = new Group();
  private readonly flames: Flame[] = [];
  private readonly materials: SpriteMaterial[] = [];
  private intensity = 0;
  private elapsed = 0;

  constructor(texture: Texture, seed: number) {
    for (let index = 0; index < FLAMES + EMBERS; index += 1) {
      const ember = index >= FLAMES;
      const material = new SpriteMaterial({
        map: texture,
        color: ember ? EMBER_COLOR : (FLAME_COLORS[index % FLAME_COLORS.length] ?? EMBER_COLOR),
        blending: ember ? AdditiveBlending : NormalBlending,
        depthWrite: false,
        depthTest: false,
        transparent: true,
      });
      const sprite = new Sprite(material);
      sprite.renderOrder = FLAME_RENDER_ORDER;
      const angle = seed * 7.3 + index * 2.39;
      sprite.position.set(Math.cos(angle) * SPREAD, 0, Math.sin(angle) * SPREAD);
      this.object.add(sprite);
      this.materials.push(material);
      this.flames.push({ sprite, baseHeight: 0.3 + (index % 4) * 0.28, phase: angle, ember });
    }
    this.object.visible = false;
  }

  setHealth(fraction: number): void {
    this.intensity = Math.max(0, Math.min(1, 1 - fraction));
    this.object.visible = this.intensity > 0.01;
  }

  update(deltaSeconds: number): void {
    if (!this.object.visible) {
      return;
    }
    this.elapsed += deltaSeconds;
    const strength = 0.55 + this.intensity * 0.45;
    for (const flame of this.flames) {
      if (flame.ember) {
        this.driftEmber(flame, strength);
      } else {
        this.flicker(flame, strength);
      }
    }
  }

  dispose(): void {
    for (const material of this.materials) {
      material.dispose();
    }
  }

  private flicker(flame: Flame, strength: number): void {
    const wave = Math.sin(this.elapsed * FLICKER_SPEED + flame.phase) * 0.5 + 0.5;
    const size = (0.55 + wave * 0.35) * strength;
    flame.sprite.scale.set(size, size * 1.6, 1);
    flame.sprite.position.y = flame.baseHeight * strength + wave * 0.1;
    flame.sprite.material.opacity = 0.7 + wave * 0.3;
  }

  private driftEmber(flame: Flame, strength: number): void {
    const cycle = (this.elapsed * 0.6 + flame.phase) % 1;
    flame.sprite.position.y = 0.4 + cycle * EMBER_RISE * strength;
    const size = 0.12 * strength;
    flame.sprite.scale.set(size, size, 1);
    flame.sprite.material.opacity = (1 - cycle) * strength;
  }
}
