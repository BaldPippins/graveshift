import { ENEMIES } from '@graveshift/shared/config';
import type { HeroId } from '@graveshift/shared/config';
import type { Unsubscribe } from '@graveshift/shared/core';
import type { PlayerMatchStats } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import type { MatchEventBus } from './MatchEventBus.ts';
import type { MatchParticipant } from './MatchParticipant.ts';
import type { MutablePlayerStats } from './MutablePlayerStats.ts';

function emptyStats(playerId: number, nickname: string, hero: HeroId): MutablePlayerStats {
  return {
    playerId,
    nickname,
    hero,
    kills: 0,
    bossKills: 0,
    damageDealt: 0,
    damageTaken: 0,
    shotsFired: 0,
    shotsHit: 0,
    revives: 0,
    downs: 0,
    deaths: 0,
    coinsEarned: 0,
  };
}

export class MatchStatsTracker {
  private readonly stats = new Map<number, MutablePlayerStats>();
  private readonly subscriptions: Unsubscribe[];

  constructor(participants: readonly MatchParticipant[], events: MatchEventBus) {
    for (const participant of participants) {
      this.stats.set(
        participant.id,
        emptyStats(participant.id, participant.nickname, participant.hero),
      );
    }
    this.subscriptions = [
      events.on(GameEventType.ShotFired, (event) => {
        this.update(event.shooterId, (stats) => {
          stats.shotsFired += 1;
          stats.shotsHit += event.hit ? 1 : 0;
        });
      }),
      events.on(GameEventType.EnemyDamaged, (event) => {
        this.update(event.attackerId, (stats) => {
          stats.damageDealt += event.amount;
        });
      }),
      events.on(GameEventType.EnemyKilled, (event) => {
        this.update(event.killerId, (stats) => {
          stats.kills += 1;
          stats.bossKills += ENEMIES[event.kind].bossOnly ? 1 : 0;
        });
      }),
      events.on(GameEventType.PlayerDamaged, (event) => {
        this.update(event.playerId, (stats) => {
          stats.damageTaken += event.amount;
        });
      }),
      events.on(GameEventType.PlayerDowned, (event) => {
        this.update(event.playerId, (stats) => {
          stats.downs += 1;
        });
      }),
      events.on(GameEventType.PlayerDied, (event) => {
        this.update(event.playerId, (stats) => {
          stats.deaths += 1;
        });
      }),
      events.on(GameEventType.PlayerRevived, (event) => {
        if (event.reviverId !== event.playerId) {
          this.update(event.reviverId, (stats) => {
            stats.revives += 1;
          });
        }
      }),
      events.on(GameEventType.CoinsEarned, (event) => {
        this.update(event.playerId, (stats) => {
          stats.coinsEarned += event.amount;
        });
      }),
    ];
  }

  snapshot(): PlayerMatchStats[] {
    return [...this.stats.values()].map((stats) => ({ ...stats }));
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
  }

  private update(playerId: number, mutate: (stats: MutablePlayerStats) => void): void {
    const stats = this.stats.get(playerId);
    if (stats !== undefined) {
      mutate(stats);
    }
  }
}
