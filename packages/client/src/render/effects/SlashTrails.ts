import { AdditiveBlending, DoubleSide, Mesh, MeshBasicMaterial, RingGeometry } from 'three';
import type { Object3D } from 'three';

const TRAIL_SECONDS = 0.24;
const SHOCKWAVE_SECONDS = 0.4;
const TRAIL_HEIGHT = 0.45;
const INNER_FRACTION = 0.35;
const SEGMENTS = 24;
const FLAT = Math.PI / 2;

interface SlashTrail {
  readonly mesh: Mesh<RingGeometry, MeshBasicMaterial>;
  readonly lifetime: number;
  readonly growth: number;
  age: number;
}

export interface SlashSpec {
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly aim: number;
  readonly reach: number;
  readonly arcRadians: number;
  readonly color: number;
}

export class SlashTrails {
  private readonly parent: Object3D;
  private readonly active: SlashTrail[] = [];

  constructor(parent: Object3D) {
    this.parent = parent;
  }

  slash(spec: SlashSpec): void {
    const geometry = new RingGeometry(
      spec.reach * INNER_FRACTION,
      spec.reach,
      SEGMENTS,
      1,
      spec.aim - spec.arcRadians / 2,
      Math.min(Math.PI * 2, spec.arcRadians),
    );
    this.spawn(geometry, spec, TRAIL_SECONDS, 0.15);
  }

  shockwave(spec: SlashSpec): void {
    const geometry = new RingGeometry(spec.reach * 0.85, spec.reach, SEGMENTS * 2);
    this.spawn(geometry, spec, SHOCKWAVE_SECONDS, 0.9);
  }

  update(deltaSeconds: number): void {
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      const trail = this.active[index];
      if (trail === undefined) {
        continue;
      }
      trail.age += deltaSeconds;
      const progress = trail.age / trail.lifetime;
      if (progress >= 1) {
        this.active.splice(index, 1);
        trail.mesh.removeFromParent();
        trail.mesh.geometry.dispose();
        trail.mesh.material.dispose();
        continue;
      }
      trail.mesh.material.opacity = 0.85 * (1 - progress);
      trail.mesh.scale.setScalar(1 + trail.growth * progress);
    }
  }

  private spawn(geometry: RingGeometry, spec: SlashSpec, lifetime: number, growth: number): void {
    const material = new MeshBasicMaterial({
      color: spec.color,
      transparent: true,
      opacity: 0.85,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = FLAT;
    mesh.position.set(spec.x, spec.height + TRAIL_HEIGHT, spec.y);
    mesh.frustumCulled = false;
    this.parent.add(mesh);
    this.active.push({ mesh, lifetime, growth, age: 0 });
  }
}
