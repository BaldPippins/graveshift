import { describe, expect, it } from 'vitest';
import { NETWORK, SIMULATION } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { ClientMessageType, ServerMessageType } from '@graveshift/shared/protocol';
import type { ServerMessage, WelcomeMessage } from '@graveshift/shared/protocol';
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

function createHarness(): Harness {
  const logger = new SilentLogger();
  const scheduler = new ManualTickScheduler();
  const rooms = new RoomRegistry({
    scheduler,
    logger,
    codes: new RoomCodeGenerator(new SeededRandom(1)),
    nextSeed: () => 11,
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
