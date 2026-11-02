import { describe, expect, it } from 'vitest';
import { vec2 } from '../core/vectorMath.ts';
import { FlowField } from './FlowField.ts';
import { MapId } from './MapDefinition.ts';
import { parseTileMap } from './parseTileMap.ts';

const map = parseTileMap({
  id: MapId.Graveyard,
  rows: ['#######', '#P....#', '###.#.#', '#S....#', '#######'],
});

describe('FlowField', () => {
  it('computes shortest distances around walls', () => {
    const field = new FlowField(map);
    field.rebuild([{ cx: 1, cy: 1 }]);
    expect(field.distanceAt(1, 1)).toBe(0);
    expect(field.distanceAt(3, 2)).toBeCloseTo(3);
    expect(field.distanceAt(1, 3)).toBeCloseTo(6);
    expect(field.distanceAt(0, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it('never cuts wall corners diagonally', () => {
    const field = new FlowField(map);
    field.rebuild([{ cx: 1, cy: 1 }]);
    const direction = vec2();
    expect(field.directionAt({ x: 2.5, y: 3.5 }, direction)).toBe(true);
    expect(direction.x).toBeCloseTo(1);
    expect(direction.y).toBeCloseTo(0);
  });

  it('follows the gradient from the spawn to the source', () => {
    const field = new FlowField(map);
    field.rebuild([{ cx: 1, cy: 1 }]);
    const position = { x: 1.5, y: 3.5 };
    const direction = vec2();
    for (
      let step = 0;
      step < 40 && field.distanceAt(Math.floor(position.x), Math.floor(position.y)) > 0;
      step += 1
    ) {
      expect(field.directionAt(position, direction)).toBe(true);
      position.x += direction.x * 0.25;
      position.y += direction.y * 0.25;
      expect(map.isBlocked(Math.floor(position.x), Math.floor(position.y), 0)).toBe(false);
    }
    expect(Math.floor(position.x)).toBe(1);
    expect(Math.floor(position.y)).toBe(1);
  });
});
