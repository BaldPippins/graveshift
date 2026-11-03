import { WAVE_COUNTS } from '../config/matchSettings.ts';
import type { MatchSettings } from '../config/matchSettings.ts';

export function isValidMatchSettings(settings: MatchSettings): boolean {
  return WAVE_COUNTS.includes(settings.totalWaves) && typeof settings.friendlyFire === 'boolean';
}
