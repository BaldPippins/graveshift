import { describe, expect, it } from 'vitest';
import graveyard from './maps/graveyard.json' with { type: 'json' };
import { parseLevelDefinition, validateLevelDefinition } from './validateLevelDefinition.ts';

describe('level definition', () => {
  it('round-trips the built-in level without data loss', () => {
    const level = parseLevelDefinition(JSON.stringify(graveyard));
    expect(JSON.parse(JSON.stringify(level))).toEqual(graveyard);
  });

  it('rejects an unsupported version and inconsistent weapon and team rules', () => {
    expect(validateLevelDefinition({ ...graveyard, version: 2 })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'version' })]),
    );
    expect(
      validateLevelDefinition({
        ...graveyard,
        team: { minPlayers: 3, maxPlayers: 2, heroes: [] },
        weapons: { allowed: [0], starting: [5] },
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'team' }),
        expect.objectContaining({ path: 'team.heroes' }),
        expect.objectContaining({ path: 'weapons.starting' }),
      ]),
    );
  });

  it('rejects empty and oversized spawn queues', () => {
    expect(
      validateLevelDefinition({ ...graveyard, waves: { ...graveyard.waves, enemies: [] } }),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'waves.enemies' })]));
    expect(
      validateLevelDefinition({
        ...graveyard,
        waves: { ...graveyard.waves, baseBudget: 1000, budgetPerWave: 0 },
      }),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'queue-too-large' })]));
  });

  it('rejects flying enemies on melee-only maps without explosive kegs', () => {
    const level = {
      ...graveyard,
      rows: graveyard.rows.map((row) => row.replaceAll('k', '.')),
      weapons: { allowed: [5], starting: [5] },
      waves: {
        ...graveyard.waves,
        totalWaves: 1,
        enemies: [{ kind: 5, weight: 1, firstWave: 1 }],
        bossWaves: [],
      },
    };
    expect(validateLevelDefinition(level)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'airborne-unreachable' })]),
    );
    expect(validateLevelDefinition({ ...level, rows: graveyard.rows })).toEqual([]);
  });
});
