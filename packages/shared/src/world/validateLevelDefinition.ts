import {
  ENEMIES,
  ENEMY_KINDS,
  HERO_IDS,
  isRangedWeapon,
  SIMULATION,
  WEAPON_IDS,
} from '../config/index.ts';
import type { EnemyKind } from '../config/index.ts';
import type { LevelDefinition } from './LevelDefinition.ts';
import type { LevelGeometryIssue } from './LevelGeometry.ts';
import { TileKind } from './TileKind.ts';
import { TILE_TRAITS } from './tileTraits.ts';
import { validateLevelGeometry } from './validateLevelGeometry.ts';

const MAX_QUEUE = 400;

function record(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberBetween(value: unknown, min: number, max: number, integer = false): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (!integer || Number.isInteger(value))
  );
}

function validIds(value: unknown, allowed: readonly number[]): value is readonly number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((id: unknown) => typeof id === 'number' && allowed.includes(id)) &&
    new Set(value).size === value.length
  );
}

function validateTeam(value: unknown, issues: LevelGeometryIssue[]): void {
  if (!record(value)) {
    issues.push({ path: 'team', code: 'invalid' });
    return;
  }
  const min = value['minPlayers'];
  const max = value['maxPlayers'];
  if (!numberBetween(min, 1, 4, true) || !numberBetween(max, 1, 4, true) || min > max) {
    issues.push({ path: 'team', code: 'invalid-size' });
  }
  if (!validIds(value['heroes'], HERO_IDS)) {
    issues.push({ path: 'team.heroes', code: 'invalid' });
  }
}

function validateWeapons(value: unknown, issues: LevelGeometryIssue[]): void {
  if (!record(value)) {
    issues.push({ path: 'weapons', code: 'invalid' });
    return;
  }
  const allowed = value['allowed'];
  const starting = value['starting'];
  if (!validIds(allowed, WEAPON_IDS)) {
    issues.push({ path: 'weapons.allowed', code: 'invalid' });
  }
  if (
    !validIds(starting, WEAPON_IDS) ||
    !validIds(allowed, WEAPON_IDS) ||
    starting.some((weapon) => !allowed.includes(weapon))
  ) {
    issues.push({ path: 'weapons.starting', code: 'invalid' });
  }
}

function validateWaves(value: unknown, issues: LevelGeometryIssue[]): void {
  if (!record(value)) {
    issues.push({ path: 'waves', code: 'invalid' });
    return;
  }
  const total = value['totalWaves'];
  if (!numberBetween(total, 1, 255, true)) {
    issues.push({ path: 'waves.totalWaves', code: 'invalid' });
  }
  for (const field of [
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
  ]) {
    const maximum =
      field === 'countdownSeconds' || field === 'intermissionSeconds'
        ? 65535 / SIMULATION.tickRate
        : 10000;
    if (!numberBetween(value[field], 0, maximum)) {
      issues.push({ path: `waves.${field}`, code: 'invalid' });
    }
  }
  if (value['firstSpawnIntervalSeconds'] === 0 || value['minSpawnIntervalSeconds'] === 0) {
    issues.push({ path: 'waves.minSpawnIntervalSeconds', code: 'invalid' });
  }
  const enemies = value['enemies'];
  if (!Array.isArray(enemies) || enemies.length === 0) {
    issues.push({ path: 'waves.enemies', code: 'invalid' });
  } else {
    const kinds = new Set<number>();
    enemies.forEach((enemy: unknown, index) => {
      if (
        !record(enemy) ||
        !numberBetween(enemy['kind'], 0, 255, true) ||
        !ENEMY_KINDS.includes(enemy['kind'] as EnemyKind) ||
        ENEMIES[enemy['kind'] as EnemyKind].bossOnly ||
        !numberBetween(enemy['weight'], Number.MIN_VALUE, 10000) ||
        !numberBetween(enemy['firstWave'], 1, 255, true) ||
        kinds.has(enemy['kind'])
      ) {
        issues.push({ path: `waves.enemies.${index}`, code: 'invalid' });
        return;
      }
      kinds.add(enemy['kind']);
    });
  }
  const bosses = value['bossWaves'];
  if (!Array.isArray(bosses) || bosses.length > 1024) {
    issues.push({ path: 'waves.bossWaves', code: 'invalid' });
  } else {
    bosses.forEach((boss: unknown, index) => {
      if (
        !record(boss) ||
        !numberBetween(boss['wave'], 1, 255, true) ||
        !numberBetween(total, 1, 255, true) ||
        boss['wave'] > total ||
        !numberBetween(boss['kind'], 0, 255, true) ||
        !ENEMY_KINDS.includes(boss['kind'] as EnemyKind) ||
        !numberBetween(boss['count'], 1, MAX_QUEUE, true)
      ) {
        issues.push({ path: `waves.bossWaves.${index}`, code: 'invalid' });
      }
    });
  }
}

function validateQueues(level: LevelDefinition, issues: LevelGeometryIssue[]): void {
  for (let wave = 1; wave <= level.waves.totalWaves; wave += 1) {
    const enemies = level.waves.enemies.filter((enemy) => enemy.firstWave <= wave);
    const baseBudget = level.waves.baseBudget + level.waves.budgetPerWave * (wave - 1);
    const minBudget =
      baseBudget * (1 + level.waves.budgetPerExtraPlayer * (level.team.minPlayers - 1));
    const maxBudget =
      baseBudget * (1 + level.waves.budgetPerExtraPlayer * (level.team.maxPlayers - 1));
    const bossCount = level.waves.bossWaves
      .filter((boss) => boss.wave === wave)
      .reduce((sum, boss) => sum + boss.count, 0);
    const minCost = Math.min(...enemies.map((enemy) => ENEMIES[enemy.kind].spawnCost));
    if (bossCount === 0 && minBudget < minCost) {
      issues.push({ path: 'waves.enemies', code: 'empty-queue' });
      return;
    }
    if (Math.floor(maxBudget / minCost) + bossCount > MAX_QUEUE) {
      issues.push({ path: 'waves', code: 'queue-too-large' });
      return;
    }
  }
}

function validateAirborneAccess(level: LevelDefinition, issues: LevelGeometryIssue[]): void {
  const keg = TILE_TRAITS[TileKind.PowderKegSpot].symbol;
  if (level.weapons.allowed.some(isRangedWeapon) || level.rows.some((row) => row.includes(keg))) {
    return;
  }
  if (
    level.waves.enemies.some(
      (enemy) => enemy.firstWave <= level.waves.totalWaves && ENEMIES[enemy.kind].airborne,
    )
  ) {
    issues.push({ path: 'waves.enemies', code: 'airborne-unreachable' });
  }
  if (level.waves.bossWaves.some((boss) => ENEMIES[boss.kind].airborne)) {
    issues.push({ path: 'waves.bossWaves', code: 'airborne-unreachable' });
  }
}

export function validateLevelDefinition(value: unknown): LevelGeometryIssue[] {
  const issues = validateLevelGeometry(value);
  if (!record(value)) {
    return issues;
  }
  if (value['version'] !== 1) {
    issues.push({ path: 'version', code: 'unsupported' });
  }
  validateTeam(value['team'], issues);
  validateWeapons(value['weapons'], issues);
  validateWaves(value['waves'], issues);
  if (issues.length === 0) {
    const level = value as unknown as LevelDefinition;
    validateQueues(level, issues);
    validateAirborneAccess(level, issues);
  }
  return issues;
}

export function parseLevelDefinition(json: string): LevelDefinition {
  const value: unknown = JSON.parse(json);
  const issues = validateLevelDefinition(value);
  if (issues.length > 0) {
    throw new Error(`Invalid level: ${JSON.stringify(issues)}`);
  }
  return value as LevelDefinition;
}
