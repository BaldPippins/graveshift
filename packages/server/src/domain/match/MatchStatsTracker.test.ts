import { describe, expect, it } from 'vitest';
import { EnemyKind, HeroId } from '@graveshift/shared/config';
import { GameEventType } from '@graveshift/shared/protocol';
import { MatchEventBus } from './MatchEventBus.ts';
import { MatchStatsTracker } from './MatchStatsTracker.ts';

const PLAYER_ID = 3;

function killBy(events: MatchEventBus, kind: EnemyKind): void {
  events.emit({
    type: GameEventType.EnemyKilled,
    enemyId: 1,
    kind,
    killerId: PLAYER_ID,
    x: 0,
    y: 0,
  });
}

describe('MatchStatsTracker', () => {
  it('counts boss kills and deaths', () => {
    const events = new MatchEventBus();
    const tracker = new MatchStatsTracker(
      [{ id: PLAYER_ID, nickname: 'Tester', hero: HeroId.Pippin, isBot: false }],
      events,
    );
    killBy(events, EnemyKind.Zombie);
    killBy(events, EnemyKind.Vampire);
    events.emit({ type: GameEventType.PlayerDied, playerId: PLAYER_ID });
    const [stats] = tracker.snapshot();
    expect(stats).toMatchObject({ kills: 2, bossKills: 1, deaths: 1 });
  });
});
