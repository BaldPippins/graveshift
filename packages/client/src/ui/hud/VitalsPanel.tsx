import type { JSX } from 'preact';
import { MELEE_RULES } from '@graveshift/shared/config';
import { furyChargeFraction } from '@graveshift/shared/rules';
import type { HudState } from '../../app/state/HudState.ts';
import { Meter } from '../components/Meter.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

const LOW_HEALTH_FRACTION = 0.3;

export interface VitalsPanelProps {
  readonly hud: HudState;
}

export function VitalsPanel(props: VitalsPanelProps): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const hud = props.hud;
  const owned = hud.ownedWeapons;
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
        <div class="weapon-box">
          <div class="weapon-box__name">{messages.weapons[hud.weapon].name}</div>
          <div class={hud.reloading ? 'weapon-box__ammo is-reloading' : 'weapon-box__ammo'}>
            {hud.reloading ? messages.hud.reloading : `${hud.ammo} / ${hud.magazineSize}`}
          </div>
          {owned.length > 1 ? (
            <div class="weapon-box__slots">
              {owned.map((weapon, index) => (
                <button
                  key={weapon}
                  type="button"
                  class={weapon === hud.weapon ? 'slot is-active' : 'slot'}
                  onClick={() => {
                    commands.selectWeapon(weapon);
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface MeleeBoxProps {
  readonly hud: HudState;
}

function MeleeBox(props: MeleeBoxProps): JSX.Element {
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
