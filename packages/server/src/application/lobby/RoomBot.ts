import type { HeroId } from '@graveshift/shared/config';

export interface RoomBot {
  readonly id: number;
  readonly nickname: string;
  readonly hero: HeroId;
}
