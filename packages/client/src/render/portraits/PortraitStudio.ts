import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { Object3D } from 'three';

const PORTRAIT_PIXELS = 192;
const FIELD_OF_VIEW = 30;
const VIEW_DIRECTION = new Vector3(0.5, 0.8, 1).normalize();
const FRAMING = 0.62;

export class PortraitStudio {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 0.01, 100);
  private readonly bounds = new Box3();
  private readonly center = new Vector3();
  private readonly size = new Vector3();

  constructor() {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(PORTRAIT_PIXELS, PORTRAIT_PIXELS, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    const key = new DirectionalLight(0xffffff, 2.4);
    key.position.set(2, 4, 3);
    this.scene.add(new HemisphereLight(0xe2eaff, 0x3a3048, 2.2), key);
  }

  shoot(subject: Object3D): string {
    this.scene.add(subject);
    subject.updateMatrixWorld(true);
    this.bounds.setFromObject(subject);
    this.bounds.getCenter(this.center);
    this.bounds.getSize(this.size);
    const radius = Math.max(this.size.x, this.size.y, this.size.z) * FRAMING;
    const distance = radius / Math.sin(((FIELD_OF_VIEW / 2) * Math.PI) / 180);
    this.camera.position.copy(this.center).addScaledVector(VIEW_DIRECTION, distance);
    this.camera.lookAt(this.center);
    this.renderer.render(this.scene, this.camera);
    this.scene.remove(subject);
    return this.renderer.domElement.toDataURL('image/png');
  }

  dispose(): void {
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
