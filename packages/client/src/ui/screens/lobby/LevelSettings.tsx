import type { JSX } from 'preact';
import { isMeleeWeapon } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import type { LevelDefinition } from '@graveshift/shared/world';
import { RadioOptions } from '../../components/RadioOptions.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export interface LevelSettingsProps {
  readonly level: LevelDefinition;
  readonly levels: readonly LevelDefinition[];
  readonly editable: boolean;
}

export function LevelSettings(props: LevelSettingsProps): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const text = messages.lobby;
  const weaponName = (weapon: WeaponId): string =>
    isMeleeWeapon(weapon) ? messages.meleeWeapons[weapon].name : messages.weapons[weapon].name;
  return (
    <div class="bot-picker">
      <span class="bot-picker__label">{text.level}</span>
      <RadioOptions
        ariaLabel={text.level}
        options={props.levels.map((level) => level.id)}
        value={props.level.id}
        label={(id) => text.levelNames[id] ?? id}
        disabled={!props.editable}
        onChange={(id) => {
          commands.selectLevel(id);
        }}
      />
      <p>
        {text.waveCount}: {props.level.waves.totalWaves}
      </p>
      <p>{text.partySize(props.level.team.minPlayers, props.level.team.maxPlayers)}</p>
      <p>
        {text.allowedHeroes}:{' '}
        {props.level.team.heroes.map((hero) => messages.heroes[hero].name).join(', ')}
      </p>
      <p>
        {text.allowedWeapons}: {props.level.weapons.allowed.map(weaponName).join(', ')}
      </p>
      <p>
        {text.startingWeapons}: {props.level.weapons.starting.map(weaponName).join(', ')}
      </p>
      <p>
        {text.enemies}:{' '}
        {props.level.waves.enemies.map((enemy) => messages.enemies[enemy.kind].name).join(', ')}
      </p>
    </div>
  );
}
