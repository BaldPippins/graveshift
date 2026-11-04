import type { JSX } from 'preact';
import type { TouchInput } from '../../input/touch/TouchInput.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { StickVisual } from './StickVisual.tsx';

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
