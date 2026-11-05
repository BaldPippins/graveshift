import type { JSX } from 'preact';
import { MELEE_RULES } from '@graveshift/shared/config';
import { furyChargeFraction } from '@graveshift/shared/rules';
import type { HudState } from '../../app/state/HudState.ts';
import { Meter } from '../components/Meter.tsx';
import { useMessages } from '../useMessages.ts';

export interface MeleeBoxProps {
  readonly hud: HudState;
}

export function MeleeBox(props: MeleeBoxProps): JSX.Element {
  const messages = useMessages();
  const hud = props.hud;
  const furious = hud.furyProgress > 0;
  return (
    <div class={furious ? 'melee-box is-furious' : 'melee-box'}>
      <span class="melee-box__name">🗡 {messages.meleeWeapons[hud.melee].name}</span>
      <Meter
        value={furious ? hud.furyProgress : furyChargeFraction(hud.meleeCharge)}
        tone="gold"
        label={
          furious
            ? messages.hud.fury
            : messages.hud.furyCharge(hud.meleeCharge, MELEE_RULES.killsForFury)
        }
      />
    </div>
  );
}
