import { ConeGeometry, MeshBasicMaterial } from 'three';
import { PALETTE } from '../../content/palette.ts';

const TONGUE_RADIUS = 0.2;
const TONGUE_HEIGHT = 0.75;
const TONGUE_SEGMENTS = 5;

function flatFlame(color: number): MeshBasicMaterial {
  return new MeshBasicMaterial({ color, depthTest: false, depthWrite: false });
}

export class FlameKit {
  readonly geometry = new ConeGeometry(TONGUE_RADIUS, TONGUE_HEIGHT, TONGUE_SEGMENTS);
  readonly outer = flatFlame(PALETTE.flameRed);
  readonly middle = flatFlame(PALETTE.flameOrange);
  readonly core = flatFlame(PALETTE.flameCore);

  constructor() {
    this.geometry.translate(0, TONGUE_HEIGHT / 2, 0);
  }

  dispose(): void {
    this.geometry.dispose();
    this.outer.dispose();
    this.middle.dispose();
    this.core.dispose();
  }
}
