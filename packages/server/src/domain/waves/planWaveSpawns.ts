import { ENEMIES, ENEMY_KINDS, WAVE_RULES } from '@graveshift/shared/config';
import type { EnemyKind, WaveRules } from '@graveshift/shared/config';
import type { SeededRandom } from '@graveshift/shared/core';
import { bossesOfWave, waveBudget } from '@graveshift/shared/rules';
import type { LevelEnemy } from '@graveshift/shared/world';

const MAX_SPAWNS_PER_WAVE = 400;

const DEFAULT_ENEMIES: readonly LevelEnemy[] = ENEMY_KINDS.map((kind) => ENEMIES[kind])
  .filter((enemy) => !enemy.bossOnly)
  .map((enemy) => ({ kind: enemy.kind, weight: enemy.spawnWeight, firstWave: enemy.firstWave }));

export function planWaveSpawns(
  wave: number,
  playerCount: number,
  random: SeededRandom,
  rules: WaveRules = WAVE_RULES,
  enemies: readonly LevelEnemy[] = DEFAULT_ENEMIES,
): EnemyKind[] {
  const candidates = enemies.filter((enemy) => enemy.firstWave <= wave);
  const spawns: EnemyKind[] = [];
  const bosses = bossesOfWave(wave, rules);
  const bossCount = bosses.reduce((sum, boss) => sum + boss.count, 0);
  let budget = waveBudget(wave, playerCount, rules);
  for (;;) {
    const affordable = candidates.filter((enemy) => ENEMIES[enemy.kind].spawnCost <= budget);
    if (affordable.length === 0 || spawns.length >= MAX_SPAWNS_PER_WAVE - bossCount) {
      break;
    }
    const chosen = random.pickWeighted(
      affordable.map((enemy) => ({ value: enemy, weight: enemy.weight })),
    );
    spawns.push(chosen.kind);
    budget -= ENEMIES[chosen.kind].spawnCost;
  }
  for (const boss of bosses) {
    spawns.push(...Array.from({ length: boss.count }, () => boss.kind));
  }
  return spawns;
}
