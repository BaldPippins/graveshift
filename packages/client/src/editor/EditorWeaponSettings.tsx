import type { JSX } from 'preact';
import type { EditorSettingsProps } from './EditorSettings.tsx';
import { EditorFieldErrors } from './EditorFieldErrors.tsx';
import { isMeleeWeapon, WEAPON_IDS } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import { Checkbox } from '../ui/components/Checkbox.tsx';

export function EditorWeaponSettings(props: EditorSettingsProps): JSX.Element {
  const { level, messages, text } = props;
  const errors = (path: string): JSX.Element => (
    <EditorFieldErrors path={path} issues={props.issues} text={text} />
  );
  const toggleWeapon = (
    field: 'allowed' | 'starting',
    weapon: WeaponId,
    checked: boolean,
  ): void => {
    const current = level.weapons[field];
    const values = checked ? [...current, weapon] : current.filter((item) => item !== weapon);
    props.onChange({ ...level, weapons: { ...level.weapons, [field]: values } });
  };
  return (
    <fieldset>
      <legend>{text.weapons}</legend>
      {errors('weapons.allowed')}
      {errors('weapons.starting')}
      {WEAPON_IDS.map((weapon) => (
        <div class="editor-rule" key={weapon}>
          <span>
            {isMeleeWeapon(weapon)
              ? messages.meleeWeapons[weapon].name
              : messages.weapons[weapon].name}
          </span>
          <label>
            <Checkbox
              checked={level.weapons.allowed.includes(weapon)}
              onChange={(checked) => {
                toggleWeapon('allowed', weapon, checked);
              }}
            />
            {text.allowed}
          </label>
          <label>
            <Checkbox
              checked={level.weapons.starting.includes(weapon)}
              onChange={(checked) => {
                toggleWeapon('starting', weapon, checked);
              }}
            />
            {text.starting}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
