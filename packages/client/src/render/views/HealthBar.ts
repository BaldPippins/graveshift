import { Group, Sprite, SpriteMaterial } from 'three';
import type { HealthBarStyle } from './HealthBarStyle.ts';

const WIDTH = 0.7;
const HEIGHT = 0.08;

export class HealthBar {
  readonly object = new Group();
  private readonly fill: Sprite;
  private readonly materials: SpriteMaterial[];
  private readonly showWhenFull: boolean;

  constructor(height: number, style: HealthBarStyle) {
    this.showWhenFull = style.showWhenFull;
    const backgroundMaterial = new SpriteMaterial({
      color: 0x1a1a1a,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
    });
    const fillMaterial = new SpriteMaterial({ color: style.fillColor, depthTest: false });
    this.materials = [backgroundMaterial, fillMaterial];
    const background = new Sprite(backgroundMaterial);
    background.scale.set(WIDTH, HEIGHT, 1);
    background.center.set(0.5, 0.5);
    this.fill = new Sprite(fillMaterial);
    this.fill.center.set(0, 0.5);
    this.fill.position.x = -WIDTH / 2;
    this.fill.renderOrder = 1;
    background.renderOrder = 0;
    this.object.add(background, this.fill);
    this.object.position.y = height;
    this.object.visible = false;
  }

  setFraction(fraction: number): void {
    this.object.visible = fraction > 0 && (this.showWhenFull || fraction < 0.999);
    this.fill.scale.set(Math.max(0.001, WIDTH * fraction), HEIGHT, 1);
  }

  dispose(): void {
    this.materials.forEach((material) => {
      material.dispose();
    });
  }
}
