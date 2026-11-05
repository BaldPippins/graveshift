import { describe, expect, it } from 'vitest';
import { ENEMIES, EnemyKind, WAVE_RULES } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { bossesOfWave, isBossWave, isFinalWave, waveBudget } from '@graveshift/shared/rules';
import { planWaveSpawns } from './planWaveSpawns.ts';

describe('planWaveSpawns', () => {
  it('spends the budget only on unlocked regular enemies', () => {
    const spawns = planWaveSpawns(1, 1, new SeededRandom(1));
    expect(spawns.length).toBeGreaterThan(0);
    expect(spawns.every((kind) => kind === EnemyKind.Zombie)).toBe(true);
    const spent = spawns.reduce<number>((sum, kind) => sum + ENEMIES[kind].spawnCost, 0);
    expect(spent).toBeLessThanOrEqual(waveBudget(1, 1));
  });

  it('adds bosses on boss waves', () => {
    expect(planWaveSpawns(10, 2, new SeededRandom(3))).toContain(EnemyKind.Vampire);
    expect(planWaveSpawns(9, 2, new SeededRandom(3))).not.toContain(EnemyKind.Vampire);
  });

  it('adds the specified bosses to extended waves', () => {
    expect(bossesOfWave(15)).toEqual([
      { wave: 15, kind: EnemyKind.Brute, count: 1 },
      { wave: 15, kind: EnemyKind.Vampire, count: 1 },
    ]);
    expect(bossesOfWave(20)).toEqual([{ wave: 20, kind: EnemyKind.Vampire, count: 2 }]);
    expect(isBossWave(15)).toBe(true);
    expect(isBossWave(20)).toBe(true);
  });

  it('ends only at the selected final wave', () => {
    for (const total of [10, 15, 20]) {
      expect(isFinalWave(total - 1, total)).toBe(false);
      expect(isFinalWave(total, total)).toBe(true);
    }
    expect(isFinalWave(10, 20)).toBe(false);
  });

  it('is deterministic for a seed and grows with party size', () => {
    expect(planWaveSpawns(6, 3, new SeededRandom(9))).toEqual(
      planWaveSpawns(6, 3, new SeededRandom(9)),
    );
    expect(planWaveSpawns(3, 4, new SeededRandom(5)).length).toBeGreaterThan(
      planWaveSpawns(3, 1, new SeededRandom(5)).length,
    );
  });

  it('uses the level enemy list, weights and boss schedule', () => {
    const rules = {
      ...WAVE_RULES,
      baseBudget: 5,
      budgetPerWave: 0,
      bossWaves: [{ wave: 2, kind: EnemyKind.Vampire, count: 2 }],
    };
    const enemies = [{ kind: EnemyKind.Zombie, weight: 1, firstWave: 1 }];
    const spawns = planWaveSpawns(2, 1, new SeededRandom(8), rules, enemies);
    expect(spawns.filter((kind) => kind === EnemyKind.Zombie)).toHaveLength(5);
    expect(spawns.filter((kind) => kind === EnemyKind.Vampire)).toHaveLength(2);
    expect(spawns).toEqual(planWaveSpawns(2, 1, new SeededRandom(8), rules, enemies));
  });
});
