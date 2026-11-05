import { describe, expect, it } from 'vitest';
import { EnemyKind, HeroId, NETWORK, SIMULATION } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { ClientMessageType, ServerMessageType } from '@graveshift/shared/protocol';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';
import type { ScoreboardEntry, ServerMessage, WelcomeMessage } from '@graveshift/shared/protocol';
import { RoomCodeGenerator } from '../lobby/RoomCodeGenerator.ts';
import { RoomRegistry } from '../lobby/RoomRegistry.ts';
import { ManualTickScheduler } from '../testing/ManualTickScheduler.ts';
import { RecordingChannel } from '../testing/RecordingChannel.ts';
import { SilentLogger } from '../testing/SilentLogger.ts';
import type { ClientConnection } from './ClientConnection.ts';
import { SessionController } from './SessionController.ts';

interface Harness {
  readonly scheduler: ManualTickScheduler;
  readonly rooms: RoomRegistry;
  readonly controller: SessionController;
}

interface Client {
  readonly connection: ClientConnection;
  readonly channel: RecordingChannel;
}

function createHarness(
  level: LevelDefinition = GRAVEYARD_LEVEL,
  extraLevels: readonly LevelDefinition[] = [],
): Harness {
  const logger = new SilentLogger();
  const scheduler = new ManualTickScheduler();
  const rooms = new RoomRegistry({
    scheduler,
    logger,
    codes: new RoomCodeGenerator(new SeededRandom(1)),
    nextSeed: () => 11,
    levels: new Map([level, ...extraLevels].map((entry) => [entry.id, entry])),
  });
  let issued = 0;
  const controller = new SessionController({
    rooms,
    logger,
    createResumeToken: () => {
      issued += 1;
      return `token-${issued}`;
    },
  });
  return { scheduler, rooms, controller };
}

function connect(harness: Harness, resumeToken = ''): Client {
  const channel = new RecordingChannel();
  const connection = harness.controller.connect(channel);
  harness.controller.handle(connection, {
    type: ClientMessageType.Hello,
    protocolVersion: NETWORK.protocolVersion,
    nickname: 'Пиппин',
    resumeToken,
  });
  return { connection, channel };
}

function welcomeOf(client: Client): WelcomeMessage {
  const welcome = client.channel.received.find(
    (message): message is WelcomeMessage => message.type === ServerMessageType.Welcome,
  );
  if (welcome === undefined) {
    throw new Error('No welcome received');
  }
  return welcome;
}

function startSoloMatchWithBot(harness: Harness, client: Client): void {
  const { controller } = harness;
  controller.handle(client.connection, { type: ClientMessageType.CreateRoom });
  controller.handle(client.connection, { type: ClientMessageType.SetBotCount, count: 1 });
  controller.handle(client.connection, { type: ClientMessageType.SetReady, ready: true });
}

function receivedTypes(client: Client): ServerMessage['type'][] {
  return client.channel.received.map((message) => message.type);
}

describe('SessionController', () => {
  it('runs consecutive matches on distinct levels without retaining the first map', () => {
    const waves = {
      ...GRAVEYARD_LEVEL.waves,
      totalWaves: 1,
      countdownSeconds: 0,
      baseBudget: 1,
      budgetPerWave: 0,
      budgetPerExtraPlayer: 0,
      minSpawnDistanceFromPlayers: 0,
      enemies: [{ kind: EnemyKind.Zombie, weight: 1, firstWave: 1 }],
      bossWaves: [],
    };
    const first = { ...GRAVEYARD_LEVEL, waves };
    const second: LevelDefinition = {
      ...first,
      id: 'small',
      width: 8,
      height: 8,
      rows: [
        '########',
        '#P...S.#',
        '#......#',
        '#......#',
        '#......#',
        '#......#',
        '#......#',
        '########',
      ],
    };
    const harness = createHarness(first, [second]);
    const host = connect(harness);
    const { controller, scheduler } = harness;
    controller.handle(host.connection, { type: ClientMessageType.CreateRoom });
    controller.handle(host.connection, { type: ClientMessageType.SetBotCount, count: 1 });
    controller.handle(host.connection, { type: ClientMessageType.SetReady, ready: true });
    for (let tick = 0; tick < 8000 && scheduler.activeTasks > 0; tick += 1) {
      scheduler.advance(1);
    }
    expect(scheduler.activeTasks).toBe(0);
    expect(
      host.channel.received.some((message) => message.type === ServerMessageType.MatchEnded),
    ).toBe(true);
    controller.handle(host.connection, { type: ClientMessageType.SelectLevel, levelId: 'small' });
    controller.handle(host.connection, { type: ClientMessageType.SetReady, ready: true });
    expect(
      host.channel.received.findLast((message) => message.type === ServerMessageType.MatchStarted),
    ).toMatchObject({ level: { id: 'small', width: 8, height: 8 }, settings: { totalWaves: 1 } });
    scheduler.advance(1);
    const snapshot = host.channel.received.findLast(
      (message) => message.type === ServerMessageType.Snapshot,
    );
    expect(snapshot === undefined ? undefined : snapshot.players[0]).toMatchObject({
      x: 1.5,
      y: 1.5,
    });
    expect(snapshot === undefined ? undefined : snapshot.obstacles).toEqual([]);
    controller.disconnect(host.connection);
    const resumed = connect(harness, welcomeOf(host).resumeToken);
    const restart = resumed.channel.received.find(
      (message) => message.type === ServerMessageType.MatchStarted,
    );
    expect(restart).toMatchObject({ resumed: true, level: { id: 'small', width: 8, height: 8 } });
    scheduler.advance(1);
    expect(
      resumed.channel.received.some((message) => message.type === ServerMessageType.Snapshot),
    ).toBe(true);
  });
  it('allows only the host to change levels and resets readiness without removing players', () => {
    const arena: LevelDefinition = {
      ...GRAVEYARD_LEVEL,
      id: 'arena',
      width: 8,
      height: 8,
      rows: [
        '########',
        '#P....S#',
        '#......#',
        '#......#',
        '#......#',
        '#......#',
        '#......#',
        '########',
      ],
      team: { minPlayers: 2, maxPlayers: 2, heroes: [HeroId.Agatha] },
      waves: { ...GRAVEYARD_LEVEL.waves, totalWaves: 3, bossWaves: [] },
    };
    const harness = createHarness(GRAVEYARD_LEVEL, [arena]);
    const host = connect(harness);
    const guest = connect(harness);
    const { controller } = harness;
    controller.handle(host.connection, { type: ClientMessageType.CreateRoom });
    const room = host.channel.received.find(
      (message) => message.type === ServerMessageType.RoomState,
    );
    if (room === undefined) {
      throw new Error('Room missing');
    }
    controller.handle(guest.connection, { type: ClientMessageType.JoinRoom, code: room.code });
    controller.handle(host.connection, { type: ClientMessageType.SetReady, ready: true });
    controller.handle(guest.connection, { type: ClientMessageType.SelectLevel, levelId: 'arena' });
    expect(host.channel.received.at(-1)).toMatchObject({ levelId: 'graveyard' });
    controller.handle(host.connection, { type: ClientMessageType.SelectLevel, levelId: 'arena' });
    expect(guest.channel.received.at(-1)).toMatchObject({
      levelId: 'arena',
      settings: { totalWaves: 3 },
      members: [
        { ready: false, hero: HeroId.Pippin },
        { ready: false, hero: HeroId.Watchman },
      ],
    });
    controller.handle(host.connection, { type: ClientMessageType.SetReady, ready: true });
    controller.handle(guest.connection, { type: ClientMessageType.SetReady, ready: true });
    expect(
      host.channel.received.some((message) => message.type === ServerMessageType.MatchStarted),
    ).toBe(false);
    controller.handle(host.connection, { type: ClientMessageType.SelectHero, hero: HeroId.Agatha });
    controller.handle(guest.connection, {
      type: ClientMessageType.SelectHero,
      hero: HeroId.Agatha,
    });
    controller.handle(guest.connection, { type: ClientMessageType.SetReady, ready: true });
    expect(host.channel.received).toContainEqual(
      expect.objectContaining({ type: ServerMessageType.MatchStarted, level: arena }),
    );
  });
  it('enforces level party and hero restrictions for players and bots', () => {
    const harness = createHarness({
      ...GRAVEYARD_LEVEL,
      team: { minPlayers: 2, maxPlayers: 2, heroes: [HeroId.Watchman] },
    });
    const client = connect(harness);
    harness.controller.handle(client.connection, { type: ClientMessageType.CreateRoom });
    harness.controller.handle(client.connection, {
      type: ClientMessageType.SelectHero,
      hero: HeroId.Pippin,
    });
    harness.controller.handle(client.connection, { type: ClientMessageType.SetReady, ready: true });
    expect(
      client.channel.received.some((message) => message.type === ServerMessageType.MatchStarted),
    ).toBe(false);
    harness.controller.handle(client.connection, { type: ClientMessageType.SetBotCount, count: 3 });
    const state = client.channel.received.findLast(
      (message) => message.type === ServerMessageType.RoomState,
    );
    expect(state === undefined ? [] : state.members.map((member) => member.hero)).toEqual([
      HeroId.Watchman,
      HeroId.Watchman,
    ]);
    expect(
      client.channel.received.some((message) => message.type === ServerMessageType.MatchStarted),
    ).toBe(true);
  });
  it('preserves settings when the host leaves and transfers control', () => {
    const harness = createHarness();
    const host = connect(harness);
    const guest = connect(harness);
    const { controller } = harness;
    controller.handle(host.connection, { type: ClientMessageType.CreateRoom });
    const room = host.channel.received.find(
      (message) => message.type === ServerMessageType.RoomState,
    );
    if (room === undefined) {
      throw new Error('Room missing');
    }
    controller.handle(guest.connection, { type: ClientMessageType.JoinRoom, code: room.code });
    controller.handle(host.connection, {
      type: ClientMessageType.SetMatchSettings,
      settings: { totalWaves: 15, friendlyFire: false },
    });
    controller.handle(host.connection, { type: ClientMessageType.LeaveRoom });
    expect(guest.channel.received.at(-1)).toMatchObject({
      type: ServerMessageType.RoomState,
      hostId: welcomeOf(guest).clientId,
      settings: { totalWaves: 10, friendlyFire: false },
    });
    controller.handle(guest.connection, {
      type: ClientMessageType.SetMatchSettings,
      settings: { totalWaves: 20, friendlyFire: false },
    });
    expect(guest.channel.received.at(-1)).toMatchObject({
      type: ServerMessageType.RoomState,
      settings: { totalWaves: 10, friendlyFire: false },
    });
  });
  it('synchronizes host settings and restores them on reconnect', () => {
    const harness = createHarness();
    const host = connect(harness);
    const guest = connect(harness);
    const { controller } = harness;
    controller.handle(host.connection, { type: ClientMessageType.CreateRoom });
    const room = host.channel.received.find(
      (message) => message.type === ServerMessageType.RoomState,
    );
    if (room === undefined) {
      throw new Error('Room missing');
    }
    controller.handle(guest.connection, { type: ClientMessageType.JoinRoom, code: room.code });
    const chosen = { totalWaves: 10, friendlyFire: false } as const;
    controller.handle(host.connection, {
      type: ClientMessageType.SetMatchSettings,
      settings: chosen,
    });
    controller.handle(guest.connection, {
      type: ClientMessageType.SetMatchSettings,
      settings: { totalWaves: 10, friendlyFire: true },
    });
    const state = guest.channel.received
      .filter((message) => message.type === ServerMessageType.RoomState)
      .at(-1);
    expect(state).toMatchObject({ settings: chosen });
    controller.handle(host.connection, { type: ClientMessageType.SetReady, ready: true });
    controller.handle(guest.connection, { type: ClientMessageType.SetReady, ready: true });
    controller.handle(host.connection, {
      type: ClientMessageType.SetMatchSettings,
      settings: { totalWaves: 10, friendlyFire: true },
    });
    controller.disconnect(guest.connection);
    const resumed = connect(harness, welcomeOf(guest).resumeToken);
    expect(resumed.channel.received).toContainEqual(
      expect.objectContaining({
        type: ServerMessageType.MatchStarted,
        settings: chosen,
        resumed: true,
      }),
    );
  });
  it('holds the seat of a player who drops mid-match and hands it back on reconnect', () => {
    const harness = createHarness();
    const first = connect(harness);
    startSoloMatchWithBot(harness, first);
    harness.scheduler.advance(10);

    harness.controller.disconnect(first.connection);
    harness.scheduler.advance(10);
    expect(harness.controller.trackedSessions).toBe(1);
    expect(harness.rooms.size).toBe(1);

    const second = connect(harness, welcomeOf(first).resumeToken);
    const welcome = welcomeOf(second);
    expect(welcome.resumed).toBe(true);
    expect(welcome.clientId).toBe(welcomeOf(first).clientId);
    expect(second.connection.session).toBe(first.connection.session);
    expect(
      second.channel.received.some(
        (message) => message.type === ServerMessageType.MatchStarted && message.resumed,
      ),
    ).toBe(true);
    harness.scheduler.advance(2);
    expect(receivedTypes(second)).toContain(ServerMessageType.Snapshot);
  });

  it('restores the complete scoreboard when a player reconnects', () => {
    const harness = createHarness();
    const first = connect(harness);
    startSoloMatchWithBot(harness, first);
    const latest = new Map<number, ScoreboardEntry>();
    for (let tick = 0; tick < 1800; tick += 1) {
      harness.scheduler.advance(1);
      const updates = first.channel.received.filter(
        (message) => message.type === ServerMessageType.ScoreboardUpdate,
      );
      for (const update of updates) {
        for (const player of update.players) {
          latest.set(player.playerId, player);
        }
      }
      if ([...latest.values()].some((player) => player.score > 0)) {
        break;
      }
    }
    expect([...latest.values()].some((player) => player.score > 0)).toBe(true);
    harness.controller.disconnect(first.connection);
    const resumed = connect(harness, welcomeOf(first).resumeToken);
    const restored = resumed.channel.received.find(
      (message) => message.type === ServerMessageType.ScoreboardUpdate,
    );
    expect(restored).toBeDefined();
    if (restored === undefined) {
      throw new Error('Scoreboard missing');
    }
    expect(restored.players).toHaveLength(2);
    expect(restored.players).toEqual(expect.arrayContaining([...latest.values()]));
  });

  it('lets a reconnecting client take over before the old socket times out', () => {
    const harness = createHarness();
    const first = connect(harness);
    startSoloMatchWithBot(harness, first);
    harness.scheduler.advance(5);

    const second = connect(harness, welcomeOf(first).resumeToken);
    expect(welcomeOf(second).resumed).toBe(true);
    expect(welcomeOf(second).clientId).toBe(welcomeOf(first).clientId);
    expect(first.channel.closed).toBe(true);

    harness.controller.disconnect(first.connection);
    const before = second.channel.received.length;
    harness.scheduler.advance(3);
    expect(second.channel.received.length).toBeGreaterThan(before);
    expect(harness.controller.trackedSessions).toBe(1);
    expect(harness.rooms.size).toBe(1);
  });

  it('releases the room, session and id once a held seat expires', () => {
    const harness = createHarness();
    const first = connect(harness);
    startSoloMatchWithBot(harness, first);
    harness.controller.disconnect(first.connection);
    harness.scheduler.advance(NETWORK.seatHoldSeconds * SIMULATION.tickRate + 2);
    expect(harness.rooms.size).toBe(0);
    expect(harness.scheduler.activeTasks).toBe(0);

    const late = connect(harness, welcomeOf(first).resumeToken);
    expect(welcomeOf(late).resumed).toBe(false);
    expect(harness.controller.trackedSessions).toBe(1);
    harness.controller.disconnect(late.connection);
    expect(harness.controller.trackedSessions).toBe(0);
    expect(welcomeOf(connect(harness)).clientId).toBe(welcomeOf(first).clientId);
  });

  it('leaves nothing behind after many dropped connections', () => {
    const harness = createHarness();
    for (let cycle = 0; cycle < 300; cycle += 1) {
      const client = connect(harness);
      harness.controller.handle(client.connection, { type: ClientMessageType.CreateRoom });
      harness.controller.disconnect(client.connection);
    }
    expect(harness.rooms.size).toBe(0);
    expect(harness.controller.trackedSessions).toBe(0);
    expect(welcomeOf(connect(harness)).clientId).toBe(1);
  });
  it('releases idle sessions but keeps players who sit in a room', () => {
    const harness = createHarness();
    const idle = connect(harness);
    const playing = connect(harness);
    startSoloMatchWithBot(harness, playing);
    expect(harness.controller.releaseIdleSessions()).toBe(1);
    expect(idle.channel.closed).toBe(true);
    expect(playing.channel.closed).toBe(false);
  });
});
