import { ENEMY_KINDS, EnemyKind } from '@graveshift/shared/config';
import type { ValueOf } from '@graveshift/shared/core';
export const CounterId = {
  Kills: 'kills',
  Revives: 'revives',
  Downs: 'downs',
  Wins: 'wins',
  MatchesPlayed: 'matches-played',
  WavesCleared: 'waves-cleared',
  BestWave: 'best-wave',
  FlawlessWaves: 'flawless-waves',
  BestMultikill: 'best-multikill',
  CoinsEarned: 'coins-earned',
  CoinsSpent: 'coins-spent',
  MaxedUpgrades: 'maxed-upgrades',
  ArsenalComplete: 'arsenal-complete',
  HealsCollected: 'heals-collected',
  SecondsPlayed: 'seconds-played',
  ShotsFired: 'shots-fired',
  ShotsHit: 'shots-hit',
  DamageDealt: 'damage-dealt',
  MeleeKills: 'melee-kills',
  Furies: 'furies',
  MeleeArsenalComplete: 'melee-arsenal-complete',
  MerchantRevives: 'merchant-revives',
} as const;
type StaticCounterId = ValueOf<typeof CounterId>;
type EnemyKindName = keyof typeof EnemyKind;
export type KillCounterId = `kills.${Lowercase<EnemyKindName>}`;
export type CounterId = StaticCounterId | KillCounterId;

const KILL_COUNTER_IDS = new Map<EnemyKind, KillCounterId>(
  Object.entries(EnemyKind).map(([name, kind]) => [
    kind,
    `kills.${name.toLowerCase()}` as KillCounterId,
  ]),
);

export function killCounterOf(kind: EnemyKind): KillCounterId {
  const counter = KILL_COUNTER_IDS.get(kind);
  if (counter === undefined) {
    throw new Error(`Unknown enemy kind ${kind}`);
  }
  return counter;
}

export const COUNTER_IDS: readonly CounterId[] = [
  ...Object.values(CounterId),
  ...ENEMY_KINDS.map(killCounterOf),
];
