import { describe, expect, it } from 'vitest';
import graveyard from './maps/graveyard.json' with { type: 'json' };
import { validateLevelGeometry } from './validateLevelGeometry.ts';

describe('level geometry validation', () => {
  it('accepts the built-in graveyard', () => {
    expect(validateLevelGeometry(graveyard)).toEqual([]);
  });

  it('reports invalid dimensions, symbols and missing spawns', () => {
    expect(validateLevelGeometry({ id: 'test', width: 8, height: 8, rows: ['?'] })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'rows' }),
        expect.objectContaining({ path: 'rows.0' }),
        expect.objectContaining({ path: 'rows.0.0' }),
      ]),
    );
    expect(
      validateLevelGeometry({ id: 'test', width: 8, height: 8, rows: Array(8).fill('........') }),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ path: 'spawns' })]));
  });

  it('rejects disconnected walkable areas', () => {
    const rows = [
      '########',
      '#P..#S.#',
      '#...#..#',
      '#...#..#',
      '#...#..#',
      '#...#..#',
      '#...#..#',
      '########',
    ];
    expect(validateLevelGeometry({ id: 'test', width: 8, height: 8, rows })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'connectivity' })]),
    );
  });

  it('rejects maps that exceed obstacle or trap protocol limits', () => {
    const rows = Array.from({ length: 33 }, () => 'g'.repeat(33));
    rows[0] = `PS${'n'.repeat(31)}`;
    expect(validateLevelGeometry({ id: 'test', width: 33, height: 33, rows })).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'too-many-obstacles' })]),
    );
    const traps = Array.from({ length: 17 }, () => 'n'.repeat(17));
    traps[0] = `PS${'n'.repeat(15)}`;
    expect(validateLevelGeometry({ id: 'test', width: 17, height: 17, rows: traps })).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'too-many-traps' })]),
    );
  });
});
