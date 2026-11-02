import { ENEMIES, ENEMY_KINDS } from '@graveshift/shared/config';
import type { EnemyDefinition, EnemyKind } from '@graveshift/shared/config';
import type { SeededRandom } from '@graveshift/shared/core';
import { bossesOfWave, waveBudget } from '@graveshift/shared/rules';

const MAX_SPAWNS_PER_WAVE = 400;

function regularCandidates(wave: number): EnemyDefinition[] {
  return ENEMY_KINDS.map((kind) => ENEMIES[kind]).filter(
    (definition) => !definition.bossOnly && definition.firstWave <= wave,
  );
}

export function planWaveSpawns(
  wave: number,
  playerCount: number,
  random: SeededRandom,
): EnemyKind[] {
  const candidates = regularCandidates(wave);
  const spawns: EnemyKind[] = [];
  let budget = waveBudget(wave, playerCount);
  for (;;) {
    const affordable = candidates.filter((definition) => definition.spawnCost <= budget);
    if (affordable.length === 0 || spawns.length >= MAX_SPAWNS_PER_WAVE) {
      break;
    }
    const chosen = random.pickWeighted(
      affordable.map((definition) => ({ value: definition, weight: definition.spawnWeight })),
    );
    spawns.push(chosen.kind);
    budget -= chosen.spawnCost;
  }
  for (const boss of bossesOfWave(wave)) {
    spawns.push(...Array.from({ length: boss.count }, () => boss.kind));
  }
  return spawns;
}
