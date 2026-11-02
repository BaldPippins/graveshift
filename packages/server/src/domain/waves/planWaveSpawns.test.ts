import { describe, expect, it } from 'vitest';
import { ENEMIES, EnemyKind } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { waveBudget } from '@graveshift/shared/rules';
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

  it('is deterministic for a seed and grows with party size', () => {
    expect(planWaveSpawns(6, 3, new SeededRandom(9))).toEqual(
      planWaveSpawns(6, 3, new SeededRandom(9)),
    );
    expect(planWaveSpawns(3, 4, new SeededRandom(5)).length).toBeGreaterThan(
      planWaveSpawns(3, 1, new SeededRandom(5)).length,
    );
  });
});
