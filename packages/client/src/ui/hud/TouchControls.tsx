import type { JSX } from 'preact';
import type { StickState } from '../../input/touch/StickState.ts';
import type { TouchInput } from '../../input/touch/TouchInput.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export interface StickVisualProps {
  readonly state: StickState;
  readonly tone: 'move' | 'aim';
}

function StickVisual(props: StickVisualProps): JSX.Element | null {
  if (!props.state.active) {
    return null;
  }
  return (
    <>
      <div
        class={`stick stick--${props.tone}`}
        style={{ left: `${props.state.originX}px`, top: `${props.state.originY}px` }}
      />
      <div
        class={`stick-knob stick-knob--${props.tone}`}
        style={{ left: `${props.state.knobX}px`, top: `${props.state.knobY}px` }}
      />
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
          class="touch-btn"
          onClick={() => {
            commands.reload();
          }}
        >
          ⟳
        </button>
        <button
          type="button"
          class="touch-btn"
          onClick={() => {
            commands.cycleWeapon(1);
          }}
        >
          🔫
        </button>
      </div>
    </div>
  );
}
