import { AdditiveBlending, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import type { Object3D } from 'three';
import type { TracerKind } from './TracerKind.ts';
import type { TracerSegment } from './TracerSegment.ts';

const POOL_SIZE = 96;
const HEIGHT = 0.55;
const CORE_WIDTH_FRACTION = 0.35;
const CORE_LIFT = 0.002;
const MIN_LENGTH = 0.01;

type Strip = Mesh<PlaneGeometry, MeshBasicMaterial>;

interface Tracer {
  readonly glow: Strip;
  readonly core: Strip;
  readonly segment: TracerSegment;
  kind: TracerKind | null;
  fromX: number;
  fromY: number;
  directionX: number;
  directionY: number;
  length: number;
  elapsed: number;
}

function createStrip(geometry: PlaneGeometry, parent: Object3D): Strip {
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false }),
  );
  mesh.visible = false;
  parent.add(mesh);
  return mesh;
}

export class TracerPool {
  private readonly tracers: Tracer[] = [];
  private cursor = 0;

  constructor(parent: Object3D) {
    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0.5, 0, 0);
    for (let index = 0; index < POOL_SIZE; index += 1) {
      this.tracers.push({
        glow: createStrip(geometry, parent),
        core: createStrip(geometry, parent),
        segment: { start: 0, length: 0 },
        kind: null,
        fromX: 0,
        fromY: 0,
        directionX: 1,
        directionY: 0,
        length: 0,
        elapsed: 0,
      });
    }
  }

  spawn(fromX: number, fromY: number, toX: number, toY: number, kind: TracerKind): void {
    const tracer = this.tracers[this.cursor];
    this.cursor = (this.cursor + 1) % POOL_SIZE;
    if (tracer === undefined) {
      return;
    }
    const length = Math.max(MIN_LENGTH, Math.hypot(toX - fromX, toY - fromY));
    tracer.kind = kind;
    tracer.fromX = fromX;
    tracer.fromY = fromY;
    tracer.directionX = (toX - fromX) / length;
    tracer.directionY = (toY - fromY) / length;
    tracer.length = length;
    tracer.elapsed = 0;
    const angle = -Math.atan2(tracer.directionY, tracer.directionX);
    tracer.glow.rotation.set(0, angle, 0);
    tracer.core.rotation.set(0, angle, 0);
    tracer.glow.material.color.setHex(kind.look.color);
    if (kind.look.coreColor !== null) {
      tracer.core.material.color.setHex(kind.look.coreColor);
    }
    this.place(tracer, kind);
  }

  update(deltaSeconds: number): void {
    for (const tracer of this.tracers) {
      const kind = tracer.kind;
      if (kind === null) {
        continue;
      }
      tracer.elapsed += deltaSeconds;
      if (tracer.elapsed >= kind.motion.lifetimeSeconds) {
        tracer.kind = null;
        tracer.glow.visible = false;
        tracer.core.visible = false;
        continue;
      }
      this.place(tracer, kind);
    }
  }

  private place(tracer: Tracer, kind: TracerKind): void {
    const progress = tracer.elapsed / kind.motion.lifetimeSeconds;
    kind.motion.place(tracer.segment, tracer.length, progress);
    const opacity = kind.motion.opacityAt(progress);
    this.placeStrip(tracer.glow, tracer, kind.look.width, HEIGHT, opacity);
    tracer.core.visible = kind.look.coreColor !== null;
    if (kind.look.coreColor !== null) {
      const coreWidth = kind.look.width * CORE_WIDTH_FRACTION;
      this.placeStrip(tracer.core, tracer, coreWidth, HEIGHT + CORE_LIFT, opacity);
    }
  }

  private placeStrip(
    strip: Strip,
    tracer: Tracer,
    width: number,
    height: number,
    opacity: number,
  ): void {
    const segment = tracer.segment;
    strip.position.set(
      tracer.fromX + tracer.directionX * segment.start,
      height,
      tracer.fromY + tracer.directionY * segment.start,
    );
    strip.scale.set(Math.max(MIN_LENGTH, segment.length), 1, width);
    strip.material.opacity = opacity;
    strip.visible = true;
  }
}
