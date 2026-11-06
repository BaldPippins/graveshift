import type { JSX } from 'preact';
import type { EditorSettingsProps } from './EditorSettings.tsx';
import { EditorFieldErrors } from './EditorFieldErrors.tsx';
import { HERO_IDS } from '@graveshift/shared/config';
import type { HeroId } from '@graveshift/shared/config';
import { Checkbox } from '../ui/components/Checkbox.tsx';

export function EditorTeamSettings(props: EditorSettingsProps): JSX.Element {
  const { level, messages, text } = props;
  const errors = (path: string): JSX.Element => (
    <EditorFieldErrors path={path} issues={props.issues} text={text} />
  );
  const toggleHero = (hero: HeroId, checked: boolean): void => {
    const heroes = checked
      ? [...level.team.heroes, hero]
      : level.team.heroes.filter((item) => item !== hero);
    props.onChange({ ...level, team: { ...level.team, heroes } });
  };
  return (
    <fieldset>
      <legend>{text.team}</legend>
      <label>
        {text.minPlayers}
        <input
          type="number"
          min="1"
          max="4"
          value={level.team.minPlayers}
          onChange={(event) => {
            props.onChange({
              ...level,
              team: { ...level.team, minPlayers: Number(event.currentTarget.value) },
            });
          }}
        />
      </label>
      <label>
        {text.maxPlayers}
        <input
          type="number"
          min="1"
          max="4"
          value={level.team.maxPlayers}
          onChange={(event) => {
            props.onChange({
              ...level,
              team: { ...level.team, maxPlayers: Number(event.currentTarget.value) },
            });
          }}
        />
      </label>
      {errors('team')}
      <h3>{text.heroes}</h3>
      {errors('team.heroes')}
      {HERO_IDS.map((hero) => (
        <label key={hero}>
          <Checkbox
            checked={level.team.heroes.includes(hero)}
            onChange={(checked) => {
              toggleHero(hero, checked);
            }}
          />
          {messages.heroes[hero].name}
        </label>
      ))}
    </fieldset>
  );
}
