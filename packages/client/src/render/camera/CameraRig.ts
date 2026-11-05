import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import { exponentialDecayFactor } from '@graveshift/shared/core';
import { CameraMode } from './CameraMode.ts';

const FOLLOW_HEIGHT = 9.5;
const FOLLOW_DISTANCE = 6.5;
const PORTRAIT_ZOOM = 1.45;
const WIDE_VIEW_ZOOM = 1 / 0.9;
const FOLLOW_SHARPNESS = 8;
const AIM_LEAD = 1.6;
const ORBIT_RADIUS = 15;
const ORBIT_HEIGHT = 9;
const ORBIT_SPEED = 0.06;
const SHOWCASE_DISTANCE = 4.2;
const SHOWCASE_HEIGHT = 1.9;
const SHAKE_DECAY = 7;
const SHOWCASE_FOCUS_HEIGHT = 0.55;

export class CameraRig {
  private readonly camera: PerspectiveCamera;
  private readonly focus = new Vector3();
  private readonly desiredFocus = new Vector3();
  private readonly desiredPosition = new Vector3();
  private readonly offset = new Vector3();
  private mode: CameraMode = CameraMode.Orbit;
  private orbitAngle = 0;
  private shake = 0;
  private followZoom = 1;

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  setWideView(enabled: boolean): void {
    this.followZoom = enabled ? WIDE_VIEW_ZOOM : 1;
  }

  setFocus(x: number, y: number, aimX = 0, aimY = 0): void {
    this.desiredFocus.set(x + aimX * AIM_LEAD, this.focusHeight(), y + aimY * AIM_LEAD);
  }

  snapToFocus(): void {
    this.focus.copy(this.desiredFocus);
  }

  addShake(amount: number): void {
    this.shake = Math.min(0.6, this.shake + amount);
  }

  update(deltaSeconds: number): void {
    this.focus.lerp(this.desiredFocus, exponentialDecayFactor(FOLLOW_SHARPNESS, deltaSeconds));
    this.computeOffset(deltaSeconds);
    this.desiredPosition.copy(this.focus).add(this.offset);
    this.camera.position.lerp(
      this.desiredPosition,
      exponentialDecayFactor(FOLLOW_SHARPNESS, deltaSeconds),
    );
    if (this.shake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.z += (Math.random() - 0.5) * this.shake;
      this.shake = Math.max(0, this.shake - SHAKE_DECAY * this.shake * deltaSeconds - 0.001);
    }
    this.camera.lookAt(this.focus);
  }

  private focusHeight(): number {
    return this.mode === CameraMode.Showcase ? SHOWCASE_FOCUS_HEIGHT : 0;
  }

  private computeOffset(deltaSeconds: number): void {
    switch (this.mode) {
      case CameraMode.Follow: {
        const zoom = (this.camera.aspect < 1 ? PORTRAIT_ZOOM : 1) * this.followZoom;
        this.offset.set(0, FOLLOW_HEIGHT * zoom, FOLLOW_DISTANCE * zoom);
        return;
      }
      case CameraMode.Orbit:
        this.orbitAngle += ORBIT_SPEED * deltaSeconds;
        this.offset.set(
          Math.sin(this.orbitAngle) * ORBIT_RADIUS,
          ORBIT_HEIGHT,
          Math.cos(this.orbitAngle) * ORBIT_RADIUS,
        );
        return;
      case CameraMode.Showcase: {
        const zoom = this.camera.aspect < 1 ? PORTRAIT_ZOOM : 1;
        this.offset.set(0, SHOWCASE_HEIGHT * zoom, SHOWCASE_DISTANCE * zoom);
        return;
      }
    }
  }
}
