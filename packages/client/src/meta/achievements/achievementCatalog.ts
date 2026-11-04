import { EnemyKind } from '@graveshift/shared/config';
import { CounterId, killCounterOf } from '../counters/CounterId.ts';
import type { AchievementDefinition } from './AchievementDefinition.ts';
import { AchievementId } from './AchievementId.ts';

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: AchievementId.FirstBlood, counter: CounterId.Kills, target: 1 },
  { id: AchievementId.NightWatch, counter: CounterId.Kills, target: 100 },
  { id: AchievementId.Gravedigger, counter: CounterId.Kills, target: 1000 },
  { id: AchievementId.Ghostbuster, counter: killCounterOf(EnemyKind.Ghost), target: 25 },
  { id: AchievementId.BatSwatter, counter: killCounterOf(EnemyKind.Bat), target: 40 },
  { id: AchievementId.BoneCollector, counter: killCounterOf(EnemyKind.Skeleton), target: 50 },
  { id: AchievementId.BruteForce, counter: killCounterOf(EnemyKind.Brute), target: 10 },
  { id: AchievementId.CountDown, counter: killCounterOf(EnemyKind.Vampire), target: 1 },
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
  { id: AchievementId.Slasher, counter: CounterId.MeleeKills, target: 50 },
  { id: AchievementId.Butcher, counter: CounterId.MeleeKills, target: 500 },
  { id: AchievementId.Berserk, counter: CounterId.Furies, target: 1 },
  { id: AchievementId.Bladesmith, counter: CounterId.MeleeArsenalComplete, target: 1 },
  { id: AchievementId.Necromancer, counter: CounterId.MerchantRevives, target: 1 },
];

export function achievementTarget(id: AchievementId): number {
  const definition = ACHIEVEMENTS.find((candidate) => candidate.id === id);
  return definition === undefined ? 1 : definition.target;
}
