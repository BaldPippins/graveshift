import { DoubleSide, Mesh, MeshBasicMaterial, RingGeometry } from 'three';

const STEPS = 24;
const INNER_RADIUS = 0.42;
const OUTER_RADIUS = 0.55;
const SEGMENTS = 32;

export class ProgressRing {
  readonly mesh: Mesh<RingGeometry, MeshBasicMaterial>;
  private currentStep = -1;

  constructor(color: number) {
    this.mesh = new Mesh(
      new RingGeometry(INNER_RADIUS, OUTER_RADIUS, SEGMENTS, 1, 0, 0.001),
      new MeshBasicMaterial({
        color,
        side: DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.03;
    this.mesh.visible = false;
  }

  setProgress(progress: number): void {
    const step = Math.round(Math.min(1, Math.max(0, progress)) * STEPS);
    this.mesh.visible = step > 0;
    if (step === this.currentStep || step === 0) {
      return;
    }
    this.currentStep = step;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new RingGeometry(
      INNER_RADIUS,
      OUTER_RADIUS,
      SEGMENTS,
      1,
      Math.PI / 2,
      (step / STEPS) * Math.PI * 2,
    );
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
