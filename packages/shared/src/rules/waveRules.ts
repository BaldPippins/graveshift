import { WAVE_RULES } from '../config/waves.ts';
import type { BossWave } from '../config/waves.ts';

function extraPlayers(playerCount: number): number {
  return Math.max(0, playerCount - 1);
}

export function waveBudget(wave: number, playerCount: number): number {
  const base = WAVE_RULES.baseBudget + WAVE_RULES.budgetPerWave * (wave - 1);
  return base * (1 + WAVE_RULES.budgetPerExtraPlayer * extraPlayers(playerCount));
}

export function enemyHealthMultiplier(wave: number, playerCount: number): number {
  const waveFactor = 1 + WAVE_RULES.healthGrowthPerWave * (wave - 1);
  return waveFactor * (1 + WAVE_RULES.healthPerExtraPlayer * extraPlayers(playerCount));
}

export function spawnIntervalSeconds(wave: number): number {
  const interval =
    WAVE_RULES.firstSpawnIntervalSeconds - WAVE_RULES.spawnIntervalDecayPerWave * (wave - 1);
  return Math.max(WAVE_RULES.minSpawnIntervalSeconds, interval);
}

export function isFinalWave(wave: number): boolean {
  return wave >= WAVE_RULES.totalWaves;
}

export function bossesOfWave(wave: number): readonly BossWave[] {
  return WAVE_RULES.bossWaves.filter((boss) => boss.wave === wave);
}

export function isBossWave(wave: number): boolean {
  return bossesOfWave(wave).length > 0;
}
