import { describe, expect, it } from 'vitest';
import { HeroId } from '@graveshift/shared/config';
import { ErrorCode, ServerMessageType } from '@graveshift/shared/protocol';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';
import { ClientSession } from '../session/ClientSession.ts';
import { ManualTickScheduler } from '../testing/ManualTickScheduler.ts';
import { RecordingChannel } from '../testing/RecordingChannel.ts';
import { SilentLogger } from '../testing/SilentLogger.ts';
import { Room } from './Room.ts';

function setup(levels: Map<string, LevelDefinition>): Room {
  return new Room('TEST', {
    levels,
    scheduler: new ManualTickScheduler(),
    logger: new SilentLogger(),
    nextSeed: () => 1,
    onEmpty: () => undefined,
  });
}

function player(id: number): ClientSession {
  const session = new ClientSession(id);
  session.nickname = `Player ${id}`;
  session.bind(new RecordingChannel());
  return session;
}

describe('room level changes', () => {
  it('accepts only supported wave counts and keeps a supported choice across maps', () => {
    const arena = {
      ...GRAVEYARD_LEVEL,
      id: 'arena',
      waves: { ...GRAVEYARD_LEVEL.waves, allowedTotals: [15, 20] },
    };
    const fixed = {
      ...GRAVEYARD_LEVEL,
      id: 'fixed',
      waves: { ...GRAVEYARD_LEVEL.waves, allowedTotals: [5] },
    };
    const room = setup(new Map([GRAVEYARD_LEVEL, arena, fixed].map((level) => [level.id, level])));
    const host = player(1);
    const channel = new RecordingChannel();
    host.bind(channel);
    room.join(host);
    room.setTotalWaves(host, 15);
    room.setFriendlyFire(host, false);
    room.setTotalWaves(host, 7);
    expect(channel.received.at(-1)).toMatchObject({ settings: { totalWaves: 15 } });
    room.selectLevel(host, 'arena');
    expect(channel.received.at(-1)).toMatchObject({ settings: { totalWaves: 15 } });
    room.selectLevel(host, 'fixed');
    expect(channel.received.at(-1)).toMatchObject({ settings: { totalWaves: 5 } });
  });

  it.each([10, 15, 20])('passes the chosen %i waves into the match', (totalWaves) => {
    const room = setup(new Map([[GRAVEYARD_LEVEL.id, GRAVEYARD_LEVEL]]));
    const host = player(1);
    const channel = new RecordingChannel();
    host.bind(channel);
    room.join(host);
    room.setBotCount(host, 1);
    room.setTotalWaves(host, totalWaves);
    room.setFriendlyFire(host, false);
    room.setReady(host, true);
    expect(channel.received).toContainEqual(
      expect.objectContaining({
        type: ServerMessageType.MatchStarted,
        settings: { totalWaves, friendlyFire: false },
      }),
    );
  });

  it('rejects levels too small for the humans and adjusts heroes and bots on valid changes', () => {
    const small = {
      ...GRAVEYARD_LEVEL,
      id: 'small',
      team: { minPlayers: 1, maxPlayers: 1, heroes: [HeroId.Agatha] },
    };
    const arena = {
      ...GRAVEYARD_LEVEL,
      id: 'arena',
      team: { minPlayers: 1, maxPlayers: 2, heroes: [HeroId.Agatha] },
    };
    const room = setup(new Map([GRAVEYARD_LEVEL, small, arena].map((level) => [level.id, level])));
    const host = player(1);
    const guest = player(2);
    const channel = new RecordingChannel();
    host.bind(channel);
    room.join(host);
    room.join(guest);
    room.setBotCount(host, 2);
    room.setReady(host, true);
    room.selectLevel(host, 'small');
    expect(channel.received.at(-1)).toMatchObject({ error: ErrorCode.RoomFull });
    room.selectLevel(host, 'arena');
    expect(channel.received.at(-1)).toMatchObject({
      type: ServerMessageType.RoomState,
      levelId: 'arena',
      members: [
        { hero: HeroId.Agatha, ready: false },
        { hero: HeroId.Agatha, ready: false },
      ],
    });
  });

  it('waits when the only enabled replacement cannot fit the humans', () => {
    const small = {
      ...GRAVEYARD_LEVEL,
      id: 'small',
      team: { minPlayers: 1, maxPlayers: 1, heroes: [HeroId.Agatha] },
    };
    const levels = new Map([GRAVEYARD_LEVEL, small].map((level) => [level.id, level]));
    const room = setup(levels);
    const host = player(1);
    const guest = player(2);
    const channel = new RecordingChannel();
    host.bind(channel);
    room.join(host);
    room.join(guest);
    room.setReady(host, true);
    levels.delete(GRAVEYARD_LEVEL.id);
    room.refreshLevel();
    expect(channel.received.at(-1)).toMatchObject({
      type: ServerMessageType.RoomState,
      levelId: GRAVEYARD_LEVEL.id,
      members: [{ ready: false }, { ready: false }],
    });
    room.setReady(host, true);
    room.setReady(guest, true);
    expect(room.activeMatch).toBeNull();
    room.leave(guest);
    room.refreshLevel();
    expect(channel.received.at(-1)).toMatchObject({ levelId: 'small' });
  });
});
