import type { MatchSummary } from '@graveshift/shared/model';
import type { GameEvent } from '@graveshift/shared/protocol';
import type { AchievementId } from '../../meta/achievements/AchievementId.ts';

export const ClientEventType = {
  MatchStarted: 'match-started',
  MatchFinished: 'match-finished',
  MatchLeft: 'match-left',
  AchievementUnlocked: 'achievement-unlocked',
} as const;

export interface MatchStartedEvent {
  readonly type: typeof ClientEventType.MatchStarted;
  readonly localPlayerId: number;
}

export interface MatchFinishedEvent extends MatchSummary {
  readonly type: typeof ClientEventType.MatchFinished;
  readonly localPlayerId: number;
}

export interface MatchLeftEvent {
  readonly type: typeof ClientEventType.MatchLeft;
}

export interface AchievementUnlockedEvent {
  readonly type: typeof ClientEventType.AchievementUnlocked;
  readonly achievementId: AchievementId;
}

export type ClientEvent =
  GameEvent | MatchStartedEvent | MatchFinishedEvent | MatchLeftEvent | AchievementUnlockedEvent;
