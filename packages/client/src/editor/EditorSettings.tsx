import type { JSX } from 'preact';
import {
  ENEMIES,
  ENEMY_KINDS,
  EnemyKind,
  HERO_IDS,
  isMeleeWeapon,
  WEAPON_IDS,
} from '@graveshift/shared/config';
import type { HeroId, WeaponId } from '@graveshift/shared/config';
import type { LevelDefinition, LevelGeometryIssue, LevelWaves } from '@graveshift/shared/world';
import type { Messages } from '../i18n/Messages.ts';
import { Button } from '../ui/components/Button.tsx';
import { Checkbox } from '../ui/components/Checkbox.tsx';
import type { EditorTexts } from './EditorTexts.ts';

const WAVE_FIELDS = [
  'totalWaves',
  'countdownSeconds',
  'intermissionSeconds',
  'baseBudget',
  'budgetPerWave',
  'budgetPerExtraPlayer',
  'healthGrowthPerWave',
  'healthPerExtraPlayer',
  'firstSpawnIntervalSeconds',
  'spawnIntervalDecayPerWave',
  'minSpawnIntervalSeconds',
  'minSpawnDistanceFromPlayers',
] as const;
type WaveField = (typeof WAVE_FIELDS)[number];

export interface EditorSettingsProps {
  readonly level: LevelDefinition;
  readonly issues: readonly LevelGeometryIssue[];
  readonly messages: Messages;
  readonly text: EditorTexts;
  readonly onChange: (level: LevelDefinition) => void;
  readonly onResize: (width: number, height: number) => boolean;
}

interface FieldErrorsProps {
  readonly path: string;
  readonly issues: readonly LevelGeometryIssue[];
  readonly text: EditorTexts;
}

function FieldErrors(props: FieldErrorsProps): JSX.Element {
  return (
    <>
      {props.issues
        .filter((issue) => issue.path === props.path)
        .map((issue, index) => (
          <small class="editor-error" key={`${issue.code}-${index}`}>
            {props.text.issueNames[issue.code] ?? issue.code}
          </small>
        ))}
    </>
  );
}

export function EditorSettings(props: EditorSettingsProps): JSX.Element {
  const { level, messages } = props;
  const text = props.text;
  const errors = (path: string): JSX.Element => (
    <FieldErrors path={path} issues={props.issues} text={text} />
  );
  const setWaves = (waves: LevelWaves): void => {
    props.onChange({ ...level, waves });
  };
  const setWaveNumber = (field: WaveField, value: number): void => {
    setWaves({ ...level.waves, [field]: value });
  };
  const toggleHero = (hero: HeroId, checked: boolean): void => {
    const heroes = checked
      ? [...level.team.heroes, hero]
      : level.team.heroes.filter((item) => item !== hero);
    props.onChange({ ...level, team: { ...level.team, heroes } });
  };
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
    <aside class="editor-settings">
      <fieldset>
        <legend>{text.geometry}</legend>
        <label>
          {text.id}
          <input
            value={level.id}
            onInput={(event) => {
              props.onChange({ ...level, id: event.currentTarget.value });
            }}
          />
          {errors('id')}
        </label>
        <label>
          {text.width}
          <input
            type="number"
            min="8"
            max="64"
            value={level.width}
            onChange={(event) => {
              if (!props.onResize(Number(event.currentTarget.value), level.height)) {
                event.currentTarget.value = String(level.width);
              }
            }}
          />
          {errors('width')}
        </label>
        <label>
          {text.height}
          <input
            type="number"
            min="8"
            max="64"
            value={level.height}
            onChange={(event) => {
              if (!props.onResize(level.width, Number(event.currentTarget.value))) {
                event.currentTarget.value = String(level.height);
              }
            }}
          />
          {errors('height')}
        </label>
      </fieldset>
      <fieldset>
        <legend>{text.waves}</legend>
        {WAVE_FIELDS.map((field) => (
          <label key={field}>
            {text.fieldNames[field]}
            <input
              type="number"
              step="any"
              value={level.waves[field]}
              onChange={(event) => {
                setWaveNumber(field, Number(event.currentTarget.value));
              }}
            />
            {errors(`waves.${field}`)}
          </label>
        ))}
        {errors('waves')}
        <h3>{text.enemies}</h3>
        {errors('waves.enemies')}
        {ENEMY_KINDS.filter((kind) => !ENEMIES[kind].bossOnly).map((kind) => {
          const index = level.waves.enemies.findIndex((enemy) => enemy.kind === kind);
          const enemy = level.waves.enemies[index];
          return (
            <div class="editor-rule" key={kind}>
              <label>
                <Checkbox
                  checked={enemy !== undefined}
                  onChange={(checked) => {
                    const enemies = checked
                      ? [
                          ...level.waves.enemies,
                          {
                            kind,
                            weight: ENEMIES[kind].spawnWeight,
                            firstWave: ENEMIES[kind].firstWave,
                          },
                        ]
                      : level.waves.enemies.filter((item) => item.kind !== kind);
                    setWaves({ ...level.waves, enemies });
                  }}
                />
                {messages.enemies[kind].name}
              </label>
              {enemy === undefined ? null : (
                <>
                  <label>
                    {text.weight}
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={enemy.weight}
                      onChange={(event) => {
                        const enemies = level.waves.enemies.map((item) =>
                          item.kind === kind
                            ? { ...item, weight: Number(event.currentTarget.value) }
                            : item,
                        );
                        setWaves({ ...level.waves, enemies });
                      }}
                    />
                  </label>
                  <label>
                    {text.firstWave}
                    <input
                      type="number"
                      min="1"
                      max="255"
                      value={enemy.firstWave}
                      onChange={(event) => {
                        const enemies = level.waves.enemies.map((item) =>
                          item.kind === kind
                            ? { ...item, firstWave: Number(event.currentTarget.value) }
                            : item,
                        );
                        setWaves({ ...level.waves, enemies });
                      }}
                    />
                  </label>
                  {errors(`waves.enemies.${index}`)}
                </>
              )}
            </div>
          );
        })}
        <h3>{text.bosses}</h3>
        {errors('waves.bossWaves')}
        {level.waves.bossWaves.map((boss, index) => (
          <div class="editor-rule" key={index}>
            <label>
              {text.wave}
              <input
                type="number"
                min="1"
                max="255"
                value={boss.wave}
                onChange={(event) => {
                  const bossWaves = level.waves.bossWaves.map((item, i) =>
                    i === index ? { ...item, wave: Number(event.currentTarget.value) } : item,
                  );
                  setWaves({ ...level.waves, bossWaves });
                }}
              />
            </label>
            <label>
              {text.kind}
              <select
                value={boss.kind}
                onChange={(event) => {
                  const kind = ENEMY_KINDS.find(
                    (item) => item === Number(event.currentTarget.value),
                  );
                  if (kind !== undefined) {
                    setWaves({
                      ...level.waves,
                      bossWaves: level.waves.bossWaves.map((item, i) =>
                        i === index ? { ...item, kind } : item,
                      ),
                    });
                  }
                }}
              >
                {ENEMY_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {messages.enemies[kind].name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {text.count}
              <input
                type="number"
                min="1"
                max="400"
                value={boss.count}
                onChange={(event) => {
                  setWaves({
                    ...level.waves,
                    bossWaves: level.waves.bossWaves.map((item, i) =>
                      i === index ? { ...item, count: Number(event.currentTarget.value) } : item,
                    ),
                  });
                }}
              />
            </label>
            <Button
              onClick={() => {
                setWaves({
                  ...level.waves,
                  bossWaves: level.waves.bossWaves.filter((_, i) => i !== index),
                });
              }}
            >
              {text.remove}
            </Button>
            {errors(`waves.bossWaves.${index}`)}
          </div>
        ))}
        <Button
          onClick={() => {
            setWaves({
              ...level.waves,
              bossWaves: [...level.waves.bossWaves, { wave: 1, kind: EnemyKind.Brute, count: 1 }],
            });
          }}
        >
          {text.addBoss}
        </Button>
      </fieldset>
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
    </aside>
  );
}
