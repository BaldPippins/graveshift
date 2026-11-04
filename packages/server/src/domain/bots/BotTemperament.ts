import { FULL_TURN } from '@graveshift/shared/core';
import type { SeededRandom } from '@graveshift/shared/core';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SECTOR_JITTER_RADIANS = 0.3;
const SLOT_RADIUS_MIN = 2;
const SLOT_RADIUS_MAX = 3.5;
const SWAY_RADIANS = 0.5;
const SWAY_RADIANS_PER_DECISION = 0.018;
const JUMPINESS_MIN = 0.4;
const JUMPINESS_MAX = 1.6;
const GREED_MIN = 0.35;
const GREED_MAX = 0.75;

export interface BotTemperament {
  readonly sector: number;
  readonly slotRadius: number;
  readonly swayPhase: number;
  readonly jumpiness: number;
  readonly greed: number;
}

export function rollBotTemperament(random: SeededRandom, seat: number): BotTemperament {
  return {
    sector: seat * GOLDEN_ANGLE + random.range(-SECTOR_JITTER_RADIANS, SECTOR_JITTER_RADIANS),
    slotRadius: random.range(SLOT_RADIUS_MIN, SLOT_RADIUS_MAX),
    swayPhase: random.range(0, FULL_TURN),
    jumpiness: random.range(JUMPINESS_MIN, JUMPINESS_MAX),
    greed: random.range(GREED_MIN, GREED_MAX),
  };
}

export function swayedSector(temperament: BotTemperament, decisions: number): number {
  const sway = Math.sin(decisions * SWAY_RADIANS_PER_DECISION + temperament.swayPhase);
  return temperament.sector + SWAY_RADIANS * sway;
}
