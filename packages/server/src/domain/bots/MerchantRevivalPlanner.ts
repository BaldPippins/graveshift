import type { SeededRandom } from '@graveshift/shared/core';

export const BOT_REVIVE_CHANCE = 0.4;

export class MerchantRevivalPlanner {
  private readonly random: SeededRandom;
  private readonly rolledWave = new Map<number, number>();
  private readonly volunteers = new Set<number>();

  constructor(random: SeededRandom) {
    this.random = random;
  }

  isVolunteer(botId: number, wave: number): boolean {
    if (this.rolledWave.get(botId) !== wave) {
      this.rolledWave.set(botId, wave);
      if (this.random.chance(BOT_REVIVE_CHANCE)) {
        this.volunteers.add(botId);
      } else {
        this.volunteers.delete(botId);
      }
    }
    return this.volunteers.has(botId);
  }
}
