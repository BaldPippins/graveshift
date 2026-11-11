import type { WeaponId } from '@graveshift/shared/config';
import type { MatchSummary } from '@graveshift/shared/model';
import type { GameEvent } from '@graveshift/shared/protocol';
import type { LevelDefinition } from '@graveshift/shared/world';
import type { AchievementId } from '../../meta/achievements/AchievementId.ts';

export const ClientEventType = {
  MatchStarted: 'match-started',
  MatchFinished: 'match-finished',
  MatchLeft: 'match-left',
  LoadoutUpdated: 'loadout-updated',
  AchievementUnlocked: 'achievement-unlocked',
} as const;

export interface MatchStartedEvent {
  readonly type: typeof ClientEventType.MatchStarted;
  readonly localPlayerId: number;
  readonly level: LevelDefinition;
  readonly resumed?: boolean;
}

export interface MatchFinishedEvent extends MatchSummary {
  readonly type: typeof ClientEventType.MatchFinished;
  readonly localPlayerId: number;
}

export interface MatchLeftEvent {
  readonly type: typeof ClientEventType.MatchLeft;
}

export interface LoadoutUpdatedEvent {
  readonly type: typeof ClientEventType.LoadoutUpdated;
  readonly ownedWeapons: readonly WeaponId[];
}

export interface AchievementUnlockedEvent {
  readonly type: typeof ClientEventType.AchievementUnlocked;
  readonly achievementId: AchievementId;
}

export type ClientEvent =
  | GameEvent
  | MatchStartedEvent
  | MatchFinishedEvent
  | MatchLeftEvent
  | LoadoutUpdatedEvent
  | AchievementUnlockedEvent;
