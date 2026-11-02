import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';
import type { Object3D } from 'three';

const MAX_PARTICLES = 600;
const GRAVITY = -6;
const HIDDEN_HEIGHT = -100;

export class ParticleBursts {
  private readonly positions = new Float32Array(MAX_PARTICLES * 3);
  private readonly colors = new Float32Array(MAX_PARTICLES * 3);
  private readonly velocities = new Float32Array(MAX_PARTICLES * 3);
  private readonly lifetimes = new Float32Array(MAX_PARTICLES);
  private readonly geometry = new BufferGeometry();
  private cursor = 0;

  constructor(parent: Object3D) {
    for (let slot = 0; slot < MAX_PARTICLES; slot += 1) {
      this.positions[slot * 3 + 1] = HIDDEN_HEIGHT;
    }
    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new BufferAttribute(this.colors, 3));
    const points = new Points(
      this.geometry,
      new PointsMaterial({
        size: 0.12,
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    points.frustumCulled = false;
    parent.add(points);
  }

  burst(x: number, y: number, height: number, color: number, count: number, speed: number): void {
    const red = ((color >> 16) & 0xff) / 255;
    const green = ((color >> 8) & 0xff) / 255;
    const blue = (color & 0xff) / 255;
    for (let index = 0; index < count; index += 1) {
      const slot = this.cursor;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
      const angle = Math.random() * Math.PI * 2;
      const lift = Math.random();
      const offset = slot * 3;
      this.positions.set([x, height, y], offset);
      this.colors.set([red, green, blue], offset);
      this.velocities.set(
        [
          Math.cos(angle) * speed * (0.4 + Math.random()),
          lift * speed * 1.5,
          Math.sin(angle) * speed * (0.4 + Math.random()),
        ],
        offset,
      );
      this.lifetimes[slot] = 0.35 + Math.random() * 0.25;
    }
  }

  update(deltaSeconds: number): void {
    for (let slot = 0; slot < MAX_PARTICLES; slot += 1) {
      const life = this.lifetimes[slot] ?? 0;
      if (life <= 0) {
        continue;
      }
      const offset = slot * 3;
      const remaining = life - deltaSeconds;
      this.lifetimes[slot] = remaining;
      if (remaining <= 0) {
        this.positions[offset + 1] = HIDDEN_HEIGHT;
        continue;
      }
      this.velocities[offset + 1] = (this.velocities[offset + 1] ?? 0) + GRAVITY * deltaSeconds;
      for (let axis = 0; axis < 3; axis += 1) {
        this.positions[offset + axis] =
          (this.positions[offset + axis] ?? 0) +
          (this.velocities[offset + axis] ?? 0) * deltaSeconds;
      }
    }
    const position = this.geometry.getAttribute('position');
    position.needsUpdate = true;
    const colors = this.geometry.getAttribute('color');
    colors.needsUpdate = true;
  }
}
