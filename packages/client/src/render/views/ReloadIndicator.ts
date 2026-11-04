import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { PALETTE } from '../../content/palette.ts';

const SEGMENTS = 12;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export class ReloadIndicator {
  readonly object: CSS2DObject;
  private readonly element: HTMLDivElement;
  private readonly segments: SVGLineElement[] = [];
  private filledSegments = -1;

  constructor(height: number) {
    this.element = document.createElement('div');
    this.element.className = 'reload-indicator-anchor';
    this.element.style.setProperty('--reload-active', PALETTE.reloadActive);
    this.element.style.setProperty('--reload-inactive', PALETTE.reloadInactive);
    this.element.style.setProperty('--reload-icon', PALETTE.reloadIcon);
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.classList.add('reload-indicator');
    for (let index = 0; index < SEGMENTS; index += 1) {
      const angle = -(index * Math.PI * 2) / SEGMENTS - Math.PI / 2;
      const line = document.createElementNS(SVG_NAMESPACE, 'line');
      line.setAttribute('x1', String(20 + Math.cos(angle) * 14));
      line.setAttribute('y1', String(20 + Math.sin(angle) * 14));
      line.setAttribute('x2', String(20 + Math.cos(angle) * 17));
      line.setAttribute('y2', String(20 + Math.sin(angle) * 17));
      line.classList.add('reload-indicator__segment');
      svg.append(line);
      this.segments.push(line);
    }
    const icon = document.createElementNS(SVG_NAMESPACE, 'path');
    icon.setAttribute('d', 'M13 24v-6l2-3 2 3v6zm5 1v-9l2-3 2 3v9zm5-1v-6l2-3 2 3v6z');
    icon.classList.add('reload-indicator__icon');
    svg.append(icon);
    this.element.append(svg);
    this.object = new CSS2DObject(this.element);
    this.object.position.y = height;
    this.object.visible = false;
  }

  update(visible: boolean, progress: number): void {
    this.object.visible = visible;
    if (!visible) {
      return;
    }
    const filled = Math.floor(Math.max(0, Math.min(1, progress)) * SEGMENTS);
    if (filled === this.filledSegments) {
      return;
    }
    this.segments.forEach((segment, index) => {
      segment.classList.toggle('is-filled', index < filled);
    });
    this.filledSegments = filled;
  }

  dispose(): void {
    this.object.removeFromParent();
    this.element.remove();
  }
}
