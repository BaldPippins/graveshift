import type { JSX } from 'preact';
import type { StickState } from '../../input/touch/StickState.ts';
import { FIRE_THRESHOLD, STICK_RADIUS_PX } from '../../input/touch/TouchInput.ts';
import type { TouchInput } from '../../input/touch/TouchInput.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export interface StickVisualProps {
  readonly state: StickState;
  readonly tone: 'move' | 'aim';
}

function isFiring(state: StickState): boolean {
  const pull = Math.hypot(state.knobX - state.originX, state.knobY - state.originY);
  return pull / STICK_RADIUS_PX > FIRE_THRESHOLD;
}

function StickVisual(props: StickVisualProps): JSX.Element | null {
  if (!props.state.active) {
    return null;
  }
  const aiming = props.tone === 'aim';
  const firing = aiming && isFiring(props.state);
  const origin = { left: `${props.state.originX}px`, top: `${props.state.originY}px` };
  return (
    <>
      <div class={`stick stick--${props.tone}`} style={origin} />
      {aiming ? (
        <div
          class={firing ? 'stick-threshold is-firing' : 'stick-threshold'}
          style={{ ...origin, width: `${FIRE_THRESHOLD * STICK_RADIUS_PX * 2}px` }}
        />
      ) : null}
      <div
        class={
          firing
            ? `stick-knob stick-knob--${props.tone} is-firing`
            : `stick-knob stick-knob--${props.tone}`
        }
        style={{ left: `${props.state.knobX}px`, top: `${props.state.knobY}px` }}
      >
        {firing ? '🔥' : null}
      </div>
    </>
  );
}

export interface TouchControlsProps {
  readonly touch: TouchInput;
}

export function TouchControls(props: TouchControlsProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().hud;
  return (
    <div class="touch-layer">
      <StickVisual state={props.touch.moveStick.view.value} tone="move" />
      <StickVisual state={props.touch.aimStick.view.value} tone="aim" />
      <div class="touch-hints">
        <span>{text.touchMove}</span>
        <span>{text.touchAim}</span>
      </div>
      <div class="touch-buttons">
        <button
          type="button"
          class="touch-btn touch-btn--strike"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            props.touch.setMeleeHeld(true);
          }}
          onPointerUp={() => {
            props.touch.setMeleeHeld(false);
          }}
          onPointerCancel={() => {
            props.touch.setMeleeHeld(false);
          }}
        >
          🗡
        </button>
        <button
          type="button"
          class="touch-btn"
          onPointerDown={() => {
            props.touch.requestJump();
          }}
        >
          ⤒
        </button>
        <button
          type="button"
          class="touch-btn"
          onPointerDown={() => {
            commands.reload();
          }}
        >
          ⟳
        </button>
        <button
          type="button"
          class="touch-btn"
          onPointerDown={() => {
            commands.cycleWeapon(1);
          }}
        >
          🔫
        </button>
      </div>
    </div>
  );
}
