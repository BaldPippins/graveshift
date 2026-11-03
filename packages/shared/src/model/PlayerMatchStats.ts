import type { HeroId } from '../config/heroes.ts';

export interface PlayerMatchStats {
  readonly playerId: number;
  readonly nickname: string;
  readonly hero: HeroId;
  readonly kills: number;
  readonly bossKills: number;
  readonly damageDealt: number;
  readonly damageTaken: number;
  readonly shotsFired: number;
  readonly shotsHit: number;
  readonly revives: number;
  readonly downs: number;
  readonly deaths: number;
  readonly coinsEarned: number;
}
