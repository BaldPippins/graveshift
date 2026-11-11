import { describe, expect, it } from 'vitest';
import graveyard from './maps/graveyard.json' with { type: 'json' };
import { parseLevelDefinition, validateLevelDefinition } from './validateLevelDefinition.ts';
import { parseTileMap } from './parseTileMap.ts';

describe('level definition', () => {
  it('validates orientation coordinates, uniqueness, and quarter turns', () => {
    const valid = [
      { x: 3, y: 3, quarterTurns: 0 },
      { x: 4, y: 3, quarterTurns: 3 },
    ];
    expect(validateLevelDefinition({ ...graveyard, orientations: valid })).toEqual([]);
    for (const orientations of [
      [{ x: 3, y: 3, quarterTurns: 4 }],
      [{ x: -1, y: 3, quarterTurns: 1 }],
      [valid[0], valid[0]],
    ]) {
      expect(validateLevelDefinition({ ...graveyard, orientations })).toEqual(
        expect.arrayContaining([expect.objectContaining({ code: 'invalid' })]),
      );
    }
  });

  it('passes explicit orientations to the map and leaves old cells automatic', () => {
    const map = parseTileMap({
      ...graveyard,
      orientations: [{ x: 3, y: 3, quarterTurns: 2 }],
    });
    expect(map.orientationAt(3, 3)).toBe(2);
    expect(map.orientationAt(4, 3)).toBeUndefined();
    expect(parseTileMap(graveyard).orientationAt(3, 3)).toBeUndefined();
  });
  it('round-trips the built-in level without data loss', () => {
    const level = parseLevelDefinition(JSON.stringify(graveyard));
    expect(JSON.parse(JSON.stringify(level))).toEqual(graveyard);
  });

  it('normalizes legacy totalWaves and validates wave choices', () => {
    const waves = Object.fromEntries(
      Object.entries(graveyard.waves).filter(([key]) => key !== 'allowedTotals'),
    );
    const legacy = {
      ...graveyard,
      waves: {
        ...waves,
        totalWaves: 10,
        bossWaves: graveyard.waves.bossWaves.filter((boss) => boss.wave <= 10),
      },
    };
    expect(parseLevelDefinition(JSON.stringify(legacy)).waves.allowedTotals).toEqual([10]);
    expect(
      validateLevelDefinition({ ...graveyard, waves: { ...waves, allowedTotals: [] } }),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'waves.allowedTotals' })]));
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
        allowedTotals: [1],
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
