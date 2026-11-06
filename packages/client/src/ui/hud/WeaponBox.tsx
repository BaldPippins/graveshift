import type { JSX } from 'preact';
import type { HudState } from '../../app/state/HudState.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export interface WeaponBoxProps {
  readonly hud: HudState;
}

export function WeaponBox(props: WeaponBoxProps): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const owned = props.hud.ownedWeapons;
  const weapon = props.hud.weapon;
  if (weapon === null) {
    return <></>;
  }
  return (
    <div class="weapon-box">
      <div class="weapon-box__name">{messages.weapons[weapon].name}</div>
      <div class={props.hud.reloading ? 'weapon-box__ammo is-reloading' : 'weapon-box__ammo'}>
        {props.hud.reloading
          ? messages.hud.reloading
          : `${props.hud.ammo} / ${props.hud.magazineSize}`}
      </div>
      {owned.length > 1 ? (
        <div class="weapon-box__slots">
          {owned.map((weapon, index) => (
            <button
              key={weapon}
              type="button"
              class={weapon === props.hud.weapon ? 'slot is-active' : 'slot'}
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
  );
}
