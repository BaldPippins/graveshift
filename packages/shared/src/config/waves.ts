import { EnemyKind } from './enemies.ts';

export interface BossWave {
  readonly wave: number;
  readonly kind: EnemyKind;
  readonly count: number;
}

export interface WaveRules {
  readonly totalWaves: number;
  readonly countdownSeconds: number;
  readonly intermissionSeconds: number;
  readonly baseBudget: number;
  readonly budgetPerWave: number;
  readonly budgetPerExtraPlayer: number;
  readonly healthGrowthPerWave: number;
  readonly healthPerExtraPlayer: number;
  readonly firstSpawnIntervalSeconds: number;
  readonly spawnIntervalDecayPerWave: number;
  readonly minSpawnIntervalSeconds: number;
  readonly minSpawnDistanceFromPlayers: number;
  readonly bossWaves: readonly BossWave[];
}

export const WAVE_RULES: WaveRules = {
  totalWaves: 10,
  countdownSeconds: 4,
  intermissionSeconds: 12,
  baseBudget: 5,
  budgetPerWave: 3.6,
  budgetPerExtraPlayer: 0.65,
  healthGrowthPerWave: 0.12,
  healthPerExtraPlayer: 0.35,
  firstSpawnIntervalSeconds: 1.4,
  spawnIntervalDecayPerWave: 0.08,
  minSpawnIntervalSeconds: 0.25,
  minSpawnDistanceFromPlayers: 7,
  bossWaves: [
    { wave: 5, kind: EnemyKind.Brute, count: 2 },
    { wave: 10, kind: EnemyKind.Vampire, count: 1 },
  ],
};
