import { AdditiveBlending, Color, MeshStandardMaterial, Sprite, SpriteMaterial } from 'three';
import type { Material, Object3D, Texture } from 'three';
import { MAX_UPGRADE_GRADE, upgradeProgress } from '@graveshift/shared/rules';
import { isMesh, replaceMeshMaterials } from '../../assets/meshMaterials.ts';

const TINT_STRENGTH = 0.35;
const TINT_GLOW = 0.35;
const MAXED_GLOW_BASE = 0.55;
const MAXED_GLOW_SWING = 0.35;
const MAXED_GLOW_RATE = 4;
const HALO_SIZE = 0.55;

export class WeaponFinish {
  private readonly materials: MeshStandardMaterial[] = [];
  private readonly baseColors: Color[] = [];
  private readonly tint: Color;
  private readonly halo: Sprite;
  private readonly haloScale: number;
  private grade = 0;
  private elapsed = 0;

  constructor(model: Object3D, tint: number, glow: Texture) {
    this.tint = new Color(tint);
    this.halo = new Sprite(
      new SpriteMaterial({
        map: glow,
        color: tint,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    this.haloScale = HALO_SIZE / Math.max(model.scale.x, 1e-6);
    this.halo.visible = false;
    model.traverse((child) => {
      if (!isMesh(child)) {
        return;
      }
      replaceMeshMaterials(child, (material: Material) => {
        const copy = material.clone();
        if (copy instanceof MeshStandardMaterial) {
          this.materials.push(copy);
          this.baseColors.push(copy.color.clone());
        }
        return copy;
      });
    });
    model.add(this.halo);
  }

  get isMaxed(): boolean {
    return this.grade >= MAX_UPGRADE_GRADE;
  }

  setGrade(grade: number): void {
    if (grade === this.grade) {
      return;
    }
    this.grade = grade;
    const blend = upgradeProgress(grade) * TINT_STRENGTH;
    this.materials.forEach((material, index) => {
      const base = this.baseColors[index] ?? material.color;
      material.color.copy(base).lerp(this.tint, blend);
    });
  }

  glow(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    this.halo.visible = this.isMaxed;
    if (!this.isMaxed) {
      this.shine(this.tint, upgradeProgress(this.grade) * TINT_GLOW);
      return;
    }
    const pulse = Math.sin(this.elapsed * MAXED_GLOW_RATE) * 0.5 + 0.5;
    this.shine(this.tint, MAXED_GLOW_BASE + pulse * MAXED_GLOW_SWING);
    this.halo.scale.setScalar(this.haloScale * (0.8 + pulse * 0.4));
  }

  shine(color: Color, intensity: number): void {
    for (const material of this.materials) {
      material.emissive.copy(color);
      material.emissiveIntensity = intensity;
    }
  }

  dispose(): void {
    for (const material of this.materials) {
      material.dispose();
    }
    this.halo.material.dispose();
  }
}
