import type { InputSampleContext } from '../InputFrame.ts';
import type { InputSource, InputSourceState } from '../InputSource.ts';
import { VirtualStick } from './VirtualStick.ts';

const STICK_RADIUS_PX = 56;
const AIM_DEADZONE = 0.2;
const FIRE_THRESHOLD = 0.55;

export class TouchInput implements InputSource {
  readonly moveStick = new VirtualStick(STICK_RADIUS_PX);
  readonly aimStick = new VirtualStick(STICK_RADIUS_PX);
  private readonly surface: HTMLElement;
  private readonly abort = new AbortController();
  private reloadLatched = false;

  constructor(surface: HTMLElement) {
    this.surface = surface;
    const options = { signal: this.abort.signal };
    surface.addEventListener('pointerdown', this.onPointerDown, options);
    window.addEventListener('pointermove', this.onPointerMove, options);
    window.addEventListener('pointerup', this.onPointerEnd, options);
    window.addEventListener('pointercancel', this.onPointerEnd, options);
  }

  requestReload(): void {
    this.reloadLatched = true;
  }

  read(_context: InputSampleContext): InputSourceState {
    const aimMagnitude = this.aimStick.magnitude;
    const aim =
      aimMagnitude > AIM_DEADZONE ? Math.atan2(this.aimStick.vectorY, this.aimStick.vectorX) : null;
    const reload = this.reloadLatched;
    this.reloadLatched = false;
    return {
      moveX: this.moveStick.vectorX,
      moveY: this.moveStick.vectorY,
      aim,
      fire: aimMagnitude > FIRE_THRESHOLD,
      reload,
    };
  }

  reset(): void {
    this.moveStick.end();
    this.aimStick.end();
    this.reloadLatched = false;
  }

  dispose(): void {
    this.abort.abort();
    this.reset();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (
      event.pointerType === 'mouse' ||
      !(event.target instanceof Node) ||
      !this.surface.contains(event.target)
    ) {
      return;
    }
    const bounds = this.surface.getBoundingClientRect();
    const stick = event.clientX - bounds.left < bounds.width / 2 ? this.moveStick : this.aimStick;
    if (stick.isActive) {
      return;
    }
    event.preventDefault();
    stick.begin(event.pointerId, event.clientX, event.clientY);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    for (const stick of [this.moveStick, this.aimStick]) {
      if (stick.owns(event.pointerId)) {
        stick.move(event.clientX, event.clientY);
      }
    }
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    for (const stick of [this.moveStick, this.aimStick]) {
      if (stick.owns(event.pointerId)) {
        stick.end();
      }
    }
  };
}
