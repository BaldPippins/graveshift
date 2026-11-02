import type { CounterId } from '../counters/CounterId.ts';
import type { AchievementId } from './AchievementId.ts';

export interface AchievementDefinition {
  readonly id: AchievementId;
  readonly counter: CounterId;
  readonly target: number;
}
