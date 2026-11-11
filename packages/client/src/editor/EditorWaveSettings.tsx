import type { JSX } from 'preact';
import type { EditorSettingsProps } from './EditorSettings.tsx';
import { EditorFieldErrors } from './EditorFieldErrors.tsx';
import { ENEMIES, ENEMY_KINDS, EnemyKind } from '@graveshift/shared/config';
import type { LevelWaves } from '@graveshift/shared/world';
import { Button } from '../ui/components/Button.tsx';
import { Checkbox } from '../ui/components/Checkbox.tsx';

const WAVE_FIELDS = [
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

export function EditorWaveSettings(props: EditorSettingsProps): JSX.Element {
  const { level, messages, text } = props;
  const errors = (path: string): JSX.Element => (
    <EditorFieldErrors path={path} issues={props.issues} text={text} />
  );
  const setWaves = (waves: LevelWaves): void => {
    props.onChange({ ...level, waves });
  };
  const setWaveNumber = (field: WaveField, value: number): void => {
    setWaves({ ...level.waves, [field]: value });
  };
  return (
    <fieldset>
      <legend>{text.waves}</legend>
      <label>
        {text.fieldNames['allowedTotals']}
        <input
          type="text"
          value={level.waves.allowedTotals.join(', ')}
          onChange={(event) => {
            const input = event.currentTarget.value.trim();
            const allowedTotals = input === '' ? [] : input.split(',').map(Number);
            setWaves({ ...level.waves, allowedTotals });
          }}
        />
        {errors('waves.allowedTotals')}
      </label>
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
                const kind = ENEMY_KINDS.find((item) => item === Number(event.currentTarget.value));
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
  );
}
