import { signal } from '@preact/signals-core';
import type { ReadonlySignal } from '@preact/signals-core';
import { INACTIVE_STICK } from './StickState.ts';
import type { StickState } from './StickState.ts';

export class VirtualStick {
  private readonly radius: number;
  private readonly state = signal<StickState>(INACTIVE_STICK);
  private pointerId: number | null = null;

  constructor(radius: number) {
    this.radius = radius;
  }

  get view(): ReadonlySignal<StickState> {
    return this.state;
  }

  get isActive(): boolean {
    return this.pointerId !== null;
  }

  get vectorX(): number {
    return this.isActive ? (this.state.value.knobX - this.state.value.originX) / this.radius : 0;
  }

  get vectorY(): number {
    return this.isActive ? (this.state.value.knobY - this.state.value.originY) / this.radius : 0;
  }

  get magnitude(): number {
    return Math.hypot(this.vectorX, this.vectorY);
  }

  owns(pointerId: number): boolean {
    return this.pointerId === pointerId;
  }

  begin(pointerId: number, x: number, y: number): void {
    this.pointerId = pointerId;
    this.state.value = { active: true, originX: x, originY: y, knobX: x, knobY: y };
  }

  move(x: number, y: number): void {
    const { originX, originY } = this.state.value;
    const dx = x - originX;
    const dy = y - originY;
    const distance = Math.hypot(dx, dy);
    const scale = distance > this.radius ? this.radius / distance : 1;
    this.state.value = {
      active: true,
      originX,
      originY,
      knobX: originX + dx * scale,
      knobY: originY + dy * scale,
    };
  }

  end(): void {
    this.pointerId = null;
    this.state.value = INACTIVE_STICK;
  }
}
