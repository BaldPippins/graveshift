import { describe, expect, it } from 'vitest';
import { MERCHANT_RULES, SIMULATION } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { MerchantEntity } from '../entities/MerchantEntity.ts';
import { MerchantWalker } from './MerchantWalker.ts';

const ROOMS = ['#########', '#K.#...P#', '#..g....#', '#S.#....#', '#########'];
const GRAVE = { cx: 3, cy: 2 };

describe('MerchantWalker', () => {
  it('gives up a walk that a rebuilt obstacle cuts off and can run again later', () => {
    const map = parseTileMap({ id: MapId.Graveyard, rows: ROOMS });
    const graveIndex = map.indexOf(GRAVE.cx, GRAVE.cy);
    map.setIndexCleared(graveIndex, true);
    const merchant = new MerchantEntity({ x: 1.5, y: 1.5 });
    const walker = new MerchantWalker(map, new SeededRandom(3), merchant.position);
    walker.startle(merchant);
    expect(walker.isWalking).toBe(true);
    for (let tick = 0; tick < 5; tick += 1) {
      walker.step(merchant);
    }
    map.setIndexCleared(graveIndex, false);
    for (let tick = 0; tick < SIMULATION.tickRate * 5; tick += 1) {
      walker.step(merchant);
    }
    expect(walker.isWalking).toBe(false);
    expect(merchant.position.x).toBeLessThan(GRAVE.cx);
    for (let tick = 0; tick < SIMULATION.tickRate * MERCHANT_RULES.calmSeconds + 1; tick += 1) {
      walker.step(merchant);
    }
    map.setIndexCleared(graveIndex, true);
    walker.startle(merchant);
    expect(walker.isWalking).toBe(true);
  });
});
