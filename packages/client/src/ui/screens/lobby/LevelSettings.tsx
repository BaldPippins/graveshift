import type { JSX } from 'preact';
import { isMeleeWeapon } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import type { RoomStateMessage } from '@graveshift/shared/protocol';
import type { LevelDefinition } from '@graveshift/shared/world';
import { RadioOptions } from '../../components/RadioOptions.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export interface LevelSettingsProps {
  readonly level: LevelDefinition;
  readonly levels: readonly LevelDefinition[];
  readonly editable: boolean;
  readonly room: RoomStateMessage;
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
      {props.level.waves.allowedTotals.length === 1 ? (
        <p>
          {text.waveCount}: {props.room.settings.totalWaves}
        </p>
      ) : (
        <div class="bot-picker">
          <span class="bot-picker__label">{text.waveCount}</span>
          <RadioOptions
            ariaLabel={text.waveCount}
            options={props.level.waves.allowedTotals}
            value={props.room.settings.totalWaves}
            label={(total) => total}
            disabled={!props.editable}
            onChange={(totalWaves) => {
              commands.setTotalWaves(totalWaves);
            }}
          />
        </div>
      )}
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
      <details>
        <summary>{text.generationDetails}</summary>
        <p>
          {text.waveBudget(
            props.level.waves.baseBudget,
            props.level.waves.budgetPerWave,
            props.level.waves.budgetPerExtraPlayer,
          )}
        </p>
        <p>
          {text.waveHealth(
            props.level.waves.healthGrowthPerWave,
            props.level.waves.healthPerExtraPlayer,
          )}
        </p>
        <p>
          {text.waveTiming(
            props.level.waves.countdownSeconds,
            props.level.waves.intermissionSeconds,
            props.level.waves.firstSpawnIntervalSeconds,
            props.level.waves.spawnIntervalDecayPerWave,
            props.level.waves.minSpawnIntervalSeconds,
            props.level.waves.minSpawnDistanceFromPlayers,
          )}
        </p>
        {props.level.waves.enemies.map((enemy) => (
          <p key={enemy.kind}>
            {text.enemySchedule(messages.enemies[enemy.kind].name, enemy.weight, enemy.firstWave)}
          </p>
        ))}
        {props.level.waves.bossWaves.length === 0 ? (
          <p>{text.noBosses}</p>
        ) : (
          props.level.waves.bossWaves.map((boss, index) => (
            <p key={index}>
              {text.bossSchedule(messages.enemies[boss.kind].name, boss.wave, boss.count)}
            </p>
          ))
        )}
      </details>
    </div>
  );
}
