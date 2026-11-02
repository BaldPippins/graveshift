import { CounterId } from '../counters/CounterId.ts';
import type { AchievementDefinition } from './AchievementDefinition.ts';
import { AchievementId } from './AchievementId.ts';

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: AchievementId.FirstBlood, counter: CounterId.Kills, target: 1 },
  { id: AchievementId.NightWatch, counter: CounterId.Kills, target: 100 },
  { id: AchievementId.Gravedigger, counter: CounterId.Kills, target: 1000 },
  { id: AchievementId.Ghostbuster, counter: CounterId.KillsGhost, target: 25 },
  { id: AchievementId.BoneCollector, counter: CounterId.KillsSkeleton, target: 50 },
  { id: AchievementId.BruteForce, counter: CounterId.KillsBrute, target: 10 },
  { id: AchievementId.CountDown, counter: CounterId.KillsVampire, target: 1 },
  { id: AchievementId.NoOneLeftBehind, counter: CounterId.Revives, target: 1 },
  { id: AchievementId.GuardianAngel, counter: CounterId.Revives, target: 15 },
  { id: AchievementId.Dawn, counter: CounterId.Wins, target: 1 },
  { id: AchievementId.Regular, counter: CounterId.MatchesPlayed, target: 10 },
  { id: AchievementId.Untouchable, counter: CounterId.FlawlessWaves, target: 1 },
  { id: AchievementId.MeatGrinder, counter: CounterId.BestMultikill, target: 5 },
  { id: AchievementId.BigSpender, counter: CounterId.CoinsSpent, target: 2000 },
  { id: AchievementId.MaxedOut, counter: CounterId.MaxedUpgrades, target: 1 },
  { id: AchievementId.Arsenal, counter: CounterId.ArsenalComplete, target: 1 },
  { id: AchievementId.Survivor, counter: CounterId.BestWave, target: 5 },
  { id: AchievementId.Herbalist, counter: CounterId.HealsCollected, target: 20 },
];

export function achievementTarget(id: AchievementId): number {
  const definition = ACHIEVEMENTS.find((candidate) => candidate.id === id);
  return definition === undefined ? 1 : definition.target;
}
