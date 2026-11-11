import { normalizeLegacyLevel } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';

function record(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberList(value: unknown): boolean {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'number');
}

export function parseEditorDraft(json: string): LevelDefinition {
  const value: unknown = normalizeLegacyLevel(JSON.parse(json));
  if (
    !record(value) ||
    !record(value['waves']) ||
    !record(value['team']) ||
    !record(value['weapons'])
  ) {
    throw new Error('Invalid draft structure');
  }
  const waves = value['waves'];
  const team = value['team'];
  const weapons = value['weapons'];
  const numericWaveFields = [
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
  ];
  const width = value['width'];
  const height = value['height'];
  if (
    typeof value['id'] !== 'string' ||
    typeof value['version'] !== 'number' ||
    typeof width !== 'number' ||
    width < 1 ||
    width > 64 ||
    typeof height !== 'number' ||
    height < 1 ||
    height > 64 ||
    !Array.isArray(value['rows']) ||
    !value['rows'].every((row: unknown) => typeof row === 'string') ||
    (value['orientations'] !== undefined &&
      (!Array.isArray(value['orientations']) ||
        !value['orientations'].every(
          (item: unknown) =>
            record(item) &&
            typeof item['x'] === 'number' &&
            typeof item['y'] === 'number' &&
            typeof item['quarterTurns'] === 'number',
        ))) ||
    !numericWaveFields.every((field) => typeof waves[field] === 'number') ||
    !numberList(waves['allowedTotals']) ||
    !Array.isArray(waves['enemies']) ||
    !waves['enemies'].every(
      (item: unknown) =>
        record(item) &&
        typeof item['kind'] === 'number' &&
        typeof item['weight'] === 'number' &&
        typeof item['firstWave'] === 'number',
    ) ||
    !Array.isArray(waves['bossWaves']) ||
    !waves['bossWaves'].every(
      (item: unknown) =>
        record(item) &&
        typeof item['kind'] === 'number' &&
        typeof item['wave'] === 'number' &&
        typeof item['count'] === 'number',
    ) ||
    typeof team['minPlayers'] !== 'number' ||
    typeof team['maxPlayers'] !== 'number' ||
    !numberList(team['heroes']) ||
    !numberList(weapons['allowed']) ||
    !numberList(weapons['starting'])
  ) {
    throw new Error('Invalid draft structure');
  }
  return value as unknown as LevelDefinition;
}
