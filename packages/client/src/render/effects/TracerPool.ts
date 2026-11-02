import { AdditiveBlending, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import type { Object3D } from 'three';

const POOL_SIZE = 96;
const LIFETIME_SECONDS = 0.07;
const WIDTH = 0.05;
const HEIGHT = 0.55;

interface Tracer {
  readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  remaining: number;
}

export class TracerPool {
  private readonly tracers: Tracer[] = [];
  private cursor = 0;

  constructor(parent: Object3D) {
    const geometry = new PlaneGeometry(1, WIDTH);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0.5, 0, 0);
    for (let index = 0; index < POOL_SIZE; index += 1) {
      const mesh = new Mesh(
        geometry,
        new MeshBasicMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false }),
      );
      mesh.visible = false;
      parent.add(mesh);
      this.tracers.push({ mesh, remaining: 0 });
    }
  }

  spawn(fromX: number, fromY: number, toX: number, toY: number, color: number): void {
    const tracer = this.tracers[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    if (tracer === undefined) {
      return;
    }
    const dx = toX - fromX;
    const dy = toY - fromY;
    tracer.mesh.position.set(fromX, HEIGHT, fromY);
    tracer.mesh.rotation.set(0, -Math.atan2(dy, dx), 0);
    tracer.mesh.scale.set(Math.max(0.01, Math.hypot(dx, dy)), 1, 1);
    tracer.mesh.material.color.setHex(color);
    tracer.mesh.material.opacity = 1;
    tracer.mesh.visible = true;
    tracer.remaining = LIFETIME_SECONDS;
  }

  update(deltaSeconds: number): void {
    for (const tracer of this.tracers) {
      if (tracer.remaining <= 0) {
        continue;
      }
      tracer.remaining -= deltaSeconds;
      tracer.mesh.material.opacity = Math.max(0, tracer.remaining / LIFETIME_SECONDS);
      tracer.mesh.visible = tracer.remaining > 0;
    }
  }
}
