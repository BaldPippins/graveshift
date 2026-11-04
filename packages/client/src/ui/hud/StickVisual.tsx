import type { JSX } from 'preact';
import type { StickState } from '../../input/touch/StickState.ts';
import { FIRE_THRESHOLD, STICK_RADIUS_PX } from '../../input/touch/TouchInput.ts';

export interface StickVisualProps {
  readonly state: StickState;
  readonly tone: 'move' | 'aim';
}

function isFiring(state: StickState): boolean {
  const pull = Math.hypot(state.knobX - state.originX, state.knobY - state.originY);
  return pull / STICK_RADIUS_PX > FIRE_THRESHOLD;
}

export function StickVisual(props: StickVisualProps): JSX.Element | null {
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
