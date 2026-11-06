import {
  ACESFilmicToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { RENDER_QUALITY } from './RenderQuality.ts';
import { GraphicsQuality } from '../meta/settings/Settings.ts';
import type { RenderQualityProfile } from './RenderQuality.ts';
import type { RenderStats } from './RenderStats.ts';

const FIELD_OF_VIEW = 50;

export class GameRenderer {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 200);
  readonly webgl: WebGLRenderer;
  private readonly labels = new CSS2DRenderer();
  private readonly container: HTMLElement;
  private readonly resizeObserver: ResizeObserver;
  private profile: RenderQualityProfile = RENDER_QUALITY[GraphicsQuality.Medium];

  constructor(container: HTMLElement) {
    this.container = container;
    this.webgl = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.webgl.outputColorSpace = SRGBColorSpace;
    this.webgl.toneMapping = ACESFilmicToneMapping;
    this.webgl.shadowMap.type = PCFShadowMap;
    this.webgl.domElement.classList.add('game-canvas');
    this.labels.domElement.classList.add('game-labels');
    container.append(this.webgl.domElement, this.labels.domElement);
    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    this.resizeObserver.observe(container);
    this.resize();
  }

  get quality(): RenderQualityProfile {
    return this.profile;
  }

  get aspect(): number {
    return this.camera.aspect;
  }

  get canvas(): HTMLCanvasElement {
    return this.webgl.domElement;
  }

  applyQuality(level: GraphicsQuality): void {
    this.profile = RENDER_QUALITY[level];
    this.webgl.shadowMap.enabled = this.profile.shadows;
    this.resize();
  }

  get stats(): RenderStats {
    const info = this.webgl.info.render;
    return { drawCalls: info.calls, triangles: info.triangles };
  }

  render(): void {
    this.webgl.render(this.scene, this.camera);
    this.scene.matrixWorldAutoUpdate = false;
    this.labels.render(this.scene, this.camera);
    this.scene.matrixWorldAutoUpdate = true;
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    this.webgl.dispose();
    this.webgl.domElement.remove();
    this.labels.domElement.remove();
  }

  private resize(): void {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, this.profile.maxPixelRatio));
    this.webgl.setSize(width, height, false);
    this.labels.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
