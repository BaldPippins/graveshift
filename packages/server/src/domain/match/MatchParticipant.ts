import type { HeroId } from '@graveshift/shared/config';

export interface MatchParticipant {
  readonly id: number;
  readonly nickname: string;
  readonly hero: HeroId;
  readonly isBot: boolean;
}
