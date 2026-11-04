import { CircleGeometry, Mesh, MeshBasicMaterial } from 'three';

const SEGMENTS = 20;
const GROUND_LIFT = 0.02;
const OPACITY = 0.38;
const SHRINK_PER_HEIGHT = 0.25;
const MIN_SCALE = 0.55;

export class GroundShadow {
  readonly object: Mesh<CircleGeometry, MeshBasicMaterial>;

  constructor(radius: number) {
    const geometry = new CircleGeometry(radius, SEGMENTS);
    geometry.rotateX(-Math.PI / 2);
    this.object = new Mesh(
      geometry,
      new MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: OPACITY,
        depthWrite: false,
      }),
    );
    this.object.position.y = GROUND_LIFT;
    this.object.renderOrder = 1;
  }

  sync(visible: boolean, altitude: number): void {
    this.object.visible = visible;
    this.object.scale.setScalar(Math.max(MIN_SCALE, 1 - altitude * SHRINK_PER_HEIGHT));
  }

  dispose(): void {
    this.object.geometry.dispose();
    this.object.material.dispose();
    this.object.removeFromParent();
  }
}
