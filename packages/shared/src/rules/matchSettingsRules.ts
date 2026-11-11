import type { MatchSettings } from '../config/matchSettings.ts';

export function isValidMatchSettings(settings: MatchSettings): boolean {
  return (
    Number.isInteger(settings.totalWaves) &&
    settings.totalWaves >= 1 &&
    settings.totalWaves <= 255 &&
    typeof settings.friendlyFire === 'boolean'
  );
}
