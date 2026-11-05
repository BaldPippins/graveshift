import { WAVE_RULES } from '../config/waves.ts';
import type { BossWave, WaveRules } from '../config/waves.ts';

function extraPlayers(playerCount: number): number {
  return Math.max(0, playerCount - 1);
}

export function waveBudget(
  wave: number,
  playerCount: number,
  rules: WaveRules = WAVE_RULES,
): number {
  const base = rules.baseBudget + rules.budgetPerWave * (wave - 1);
  return base * (1 + rules.budgetPerExtraPlayer * extraPlayers(playerCount));
}

export function enemyHealthMultiplier(
  wave: number,
  playerCount: number,
  rules: WaveRules = WAVE_RULES,
): number {
  const waveFactor = 1 + rules.healthGrowthPerWave * (wave - 1);
  return waveFactor * (1 + rules.healthPerExtraPlayer * extraPlayers(playerCount));
}

export function spawnIntervalSeconds(wave: number, rules: WaveRules = WAVE_RULES): number {
  const interval = rules.firstSpawnIntervalSeconds - rules.spawnIntervalDecayPerWave * (wave - 1);
  return Math.max(rules.minSpawnIntervalSeconds, interval);
}

export function isFinalWave(wave: number, totalWaves: number): boolean {
  return wave >= totalWaves;
}

export function bossesOfWave(wave: number, rules: WaveRules = WAVE_RULES): readonly BossWave[] {
  return rules.bossWaves.filter((boss) => boss.wave === wave);
}

export function isBossWave(wave: number, rules: WaveRules = WAVE_RULES): boolean {
  return bossesOfWave(wave, rules).length > 0;
}
