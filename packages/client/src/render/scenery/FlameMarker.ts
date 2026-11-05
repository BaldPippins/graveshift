import { Group, Mesh } from 'three';
import type { Material } from 'three';
import type { DamageMarker } from './DamageMarker.ts';
import type { FlameKit } from './FlameKit.ts';

interface TongueLayout {
  readonly material: Material;
  readonly size: number;
  readonly angle: number;
  readonly spread: number;
  readonly layer: number;
}

interface Tongue {
  readonly mesh: Mesh;
  readonly size: number;
  readonly phase: number;
}

const SIDE_SPREAD = 0.32;
const BASE_HEIGHT = 0.25;
const FLICKER_SPEED = 11;
const STRETCH = 0.22;
const SWAY = 0.18;
const FLAME_RENDER_ORDER = 2;

export class FlameMarker implements DamageMarker {
  readonly object = new Group();
  private readonly tongues: Tongue[] = [];
  private intensity = 0;
  private elapsed = 0;

  constructor(kit: FlameKit, seed: number) {
    const angle = seed * 2.39;
    this.addTongue(kit, { material: kit.outer, size: 1, angle, spread: 0, layer: 0 });
    this.addTongue(kit, {
      material: kit.core,
      size: 0.55,
      angle: angle + 1.3,
      spread: 0,
      layer: 1,
    });
    for (const side of [-1, 1]) {
      const sideAngle = angle + side * 2.1;
      this.addTongue(kit, {
        material: kit.middle,
        size: 0.6,
        angle: sideAngle,
        spread: SIDE_SPREAD,
        layer: 0,
      });
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
    for (const tongue of this.tongues) {
      const wave = Math.sin(this.elapsed * FLICKER_SPEED + tongue.phase);
      const size = tongue.size * strength;
      tongue.mesh.scale.set(size * (1 - wave * STRETCH * 0.5), size * (1 + wave * STRETCH), size);
      tongue.mesh.rotation.z = Math.sin(this.elapsed * 3 + tongue.phase) * SWAY;
    }
  }

  dispose(): void {
    return;
  }

  private addTongue(kit: FlameKit, layout: TongueLayout): void {
    const mesh = new Mesh(kit.geometry, layout.material);
    mesh.position.set(
      Math.cos(layout.angle) * layout.spread,
      BASE_HEIGHT,
      Math.sin(layout.angle) * layout.spread,
    );
    mesh.renderOrder = FLAME_RENDER_ORDER + layout.layer;
    this.object.add(mesh);
    this.tongues.push({ mesh, size: layout.size, phase: layout.angle });
  }
}
