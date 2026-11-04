import type { JSX } from 'preact';
import type { HudState } from '../../app/state/HudState.ts';
import { Meter } from '../components/Meter.tsx';
import { MeleeBox } from './MeleeBox.tsx';
import { WeaponBox } from './WeaponBox.tsx';

const LOW_HEALTH_FRACTION = 0.3;

export interface VitalsPanelProps {
  readonly hud: HudState;
}

export function VitalsPanel(props: VitalsPanelProps): JSX.Element {
  const hud = props.hud;
  return (
    <div class="hud-bottom">
      <div class="vitals">
        <Meter
          value={hud.healthFraction}
          tone={hud.healthFraction < LOW_HEALTH_FRACTION ? 'danger' : 'health'}
          label={`❤ ${Math.ceil(hud.health)} / ${hud.maxHealth}`}
        />
      </div>
      <div class="weapon-stack">
        <MeleeBox hud={hud} />
        <WeaponBox hud={hud} />
      </div>
    </div>
  );
}
