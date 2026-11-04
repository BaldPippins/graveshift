import { describe, expect, it } from 'vitest';
import { SeededRandom } from '@graveshift/shared/core';
import { BOT_REVIVE_CHANCE, MerchantRevivalPlanner } from './MerchantRevivalPlanner.ts';

describe('MerchantRevivalPlanner', () => {
  it('volunteers in about 40% of breaks and keeps the choice for the whole break', () => {
    const planner = new MerchantRevivalPlanner(new SeededRandom(11));
    const waves = 2000;
    let volunteered = 0;
    for (let wave = 1; wave <= waves; wave += 1) {
      const choice = planner.isVolunteer(1, wave);
      expect(planner.isVolunteer(1, wave)).toBe(choice);
      volunteered += choice ? 1 : 0;
    }
    expect(volunteered / waves).toBeCloseTo(BOT_REVIVE_CHANCE, 1);
  });
});
