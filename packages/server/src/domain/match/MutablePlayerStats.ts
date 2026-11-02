import type { PlayerMatchStats } from '@graveshift/shared/model';

export type MutablePlayerStats = {
  -readonly [Key in keyof PlayerMatchStats]: PlayerMatchStats[Key];
};
