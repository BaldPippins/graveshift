import type { AimResolver } from './AimResolver.ts';
import type { InputCommands } from './InputCommands.ts';
import type { InputSampleContext } from './InputFrame.ts';
import type { InputSource, InputSourceState } from './InputSource.ts';
import { KeyBinding, WEAPON_SLOT_KEYS } from './KeyBinding.ts';

const PRIMARY_BUTTON = 0;
const SECONDARY_BUTTON = 2;

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

export class KeyboardMouseInput implements InputSource {
  private readonly pressed = new Set<string>();
  private readonly aimResolver: AimResolver;
  private readonly commands: InputCommands;
  private readonly abort = new AbortController();
  private pointerX: number | null = null;
  private pointerY: number | null = null;
  private firing = false;
  private swinging = false;
  private reloadLatched = false;
  private jumpLatched = false;

  constructor(surface: HTMLElement, aimResolver: AimResolver, commands: InputCommands) {
    this.aimResolver = aimResolver;
    this.commands = commands;
    const options = { signal: this.abort.signal };
    window.addEventListener('keydown', this.onKeyDown, options);
    window.addEventListener('keyup', this.onKeyUp, options);
    window.addEventListener('blur', this.onBlur, options);
    surface.addEventListener('pointermove', this.onPointerMove, options);
    surface.addEventListener('pointerdown', this.onPointerDown, options);
    window.addEventListener('pointerup', this.onPointerUp, options);
    surface.addEventListener('wheel', this.onWheel, { ...options, passive: true });
    surface.addEventListener('contextmenu', this.onContextMenu, options);
  }

  read(context: InputSampleContext): InputSourceState {
    const moveX = this.axis('KeyD', 'ArrowRight') - this.axis('KeyA', 'ArrowLeft');
    const moveY = this.axis('KeyS', 'ArrowDown') - this.axis('KeyW', 'ArrowUp');
    const reload = this.reloadLatched;
    const jump = this.jumpLatched || this.pressed.has(KeyBinding.Jump);
    this.reloadLatched = false;
    this.jumpLatched = false;
    return {
      moveX,
      moveY,
      aim: this.resolveAim(context),
      fire: this.firing,
      reload,
      melee: this.swinging,
      jump,
    };
  }

  reset(): void {
    this.pressed.clear();
    this.firing = false;
    this.swinging = false;
    this.reloadLatched = false;
    this.jumpLatched = false;
  }

  dispose(): void {
    this.abort.abort();
  }

  private axis(primary: string, secondary: string): number {
    return this.pressed.has(primary) || this.pressed.has(secondary) ? 1 : 0;
  }

  private resolveAim(context: InputSampleContext): number | null {
    if (this.pointerX === null || this.pointerY === null) {
      return null;
    }
    const target = this.aimResolver.screenToWorld(this.pointerX, this.pointerY);
    if (target === null) {
      return null;
    }
    return Math.atan2(target.y - context.playerY, target.x - context.playerX);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (isTypingTarget(event.target)) {
      return;
    }
    if (event.code === KeyBinding.Scoreboard) {
      event.preventDefault();
      this.commands.setScoreboardVisible(true);
      return;
    }
    if (event.code === KeyBinding.Jump) {
      event.preventDefault();
    }
    if (event.repeat) {
      return;
    }
    this.pressed.add(event.code);
    this.handleCommandKey(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
    if (event.code === KeyBinding.Scoreboard) {
      this.commands.setScoreboardVisible(false);
    }
  };

  private handleCommandKey(code: string): void {
    const slot = WEAPON_SLOT_KEYS.indexOf(code);
    if (slot >= 0) {
      this.commands.selectWeaponSlot(slot);
      return;
    }
    switch (code) {
      case KeyBinding.Reload:
        this.reloadLatched = true;
        return;
      case KeyBinding.Jump:
        this.jumpLatched = true;
        return;
      case KeyBinding.CycleWeapon:
        this.commands.cycleWeapon(1);
        return;
      case KeyBinding.Pause:
      case KeyBinding.PauseAlternate:
        this.commands.togglePause();
        return;
      case KeyBinding.Shop:
        this.commands.toggleShop();
        return;
      default:
        return;
    }
  }

  private readonly onBlur = (): void => {
    this.reset();
    this.commands.setScoreboardVisible(false);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    if (event.button === PRIMARY_BUTTON) {
      this.firing = true;
    } else if (event.button === SECONDARY_BUTTON) {
      this.swinging = true;
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    if (event.button === PRIMARY_BUTTON) {
      this.firing = false;
    } else if (event.button === SECONDARY_BUTTON) {
      this.swinging = false;
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (event.deltaY !== 0) {
      this.commands.cycleWeapon(Math.sign(event.deltaY));
    }
  };

  private readonly onContextMenu = (event: Event): void => {
    event.preventDefault();
  };
}
