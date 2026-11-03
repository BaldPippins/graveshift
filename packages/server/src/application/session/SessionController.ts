import { NETWORK, ROOM_RULES } from '@graveshift/shared/config';
import { IdPool } from '@graveshift/shared/core';
import { ClientMessageType, ErrorCode, ServerMessageType } from '@graveshift/shared/protocol';
import type { ClientMessage, HelloMessage } from '@graveshift/shared/protocol';
import type { Room } from '../lobby/Room.ts';
import type { RoomRegistry } from '../lobby/RoomRegistry.ts';
import type { MatchRunner } from '../match/MatchRunner.ts';
import type { ClientChannel } from '../ports/ClientChannel.ts';
import type { Logger } from '../ports/Logger.ts';
import { ClientConnection } from './ClientConnection.ts';
import { ClientSession } from './ClientSession.ts';
import { sanitizeNickname } from '@graveshift/shared/rules';

const MAX_CLIENT_ID = ROOM_RULES.firstBotPlayerId - 1;

export interface SessionControllerDependencies {
  readonly rooms: RoomRegistry;
  readonly logger: Logger;
  readonly createResumeToken: () => string;
}

export class SessionController {
  private readonly rooms: RoomRegistry;
  private readonly logger: Logger;
  private readonly createResumeToken: () => string;
  private readonly clientIds = new IdPool(1, MAX_CLIENT_ID);
  private readonly sessionsByToken = new Map<string, ClientSession>();

  constructor(dependencies: SessionControllerDependencies) {
    this.rooms = dependencies.rooms;
    this.logger = dependencies.logger;
    this.createResumeToken = dependencies.createResumeToken;
  }

  get trackedSessions(): number {
    return this.sessionsByToken.size;
  }

  releaseIdleSessions(): number {
    let released = 0;
    for (const session of this.sessionsByToken.values()) {
      if (session.room === null && session.isConnected) {
        session.close();
        released += 1;
      }
    }
    return released;
  }

  connect(channel: ClientChannel): ClientConnection {
    const session = new ClientSession(this.clientIds.acquire());
    session.bind(channel);
    return new ClientConnection(channel, session);
  }

  disconnect(connection: ClientConnection): void {
    const session = connection.session;
    if (!session.isBoundTo(connection.channel)) {
      return;
    }
    session.unbind();
    if (session.room !== null && session.room.suspend(session)) {
      this.logger.info('Client seat held for reconnect', { clientId: session.id });
    } else {
      this.forget(session);
    }
    this.releaseDroppedSeats();
  }

  rejectMalformed(connection: ClientConnection): void {
    connection.session.send({
      type: ServerMessageType.ErrorNotice,
      error: ErrorCode.MalformedMessage,
    });
    connection.session.close();
  }

  handle(connection: ClientConnection, message: ClientMessage): void {
    const session = connection.session;
    if (message.type === ClientMessageType.Hello) {
      this.greet(connection, message);
      return;
    }
    if (message.type === ClientMessageType.Ping) {
      session.send({
        type: ServerMessageType.Pong,
        clientTime: message.clientTime,
        serverTick: this.serverTickOf(session),
      });
      this.inMatch(session, (match) => {
        match.reportPing(session.id, message.roundTripMilliseconds);
      });
      return;
    }
    if (!session.isIdentified) {
      this.fail(session, ErrorCode.HandshakeRequired);
      return;
    }
    this.route(session, message);
  }

  private greet(connection: ClientConnection, message: HelloMessage): void {
    const session = connection.session;
    if (message.protocolVersion !== NETWORK.protocolVersion) {
      this.fail(session, ErrorCode.VersionMismatch);
      session.close();
      return;
    }
    const nickname = sanitizeNickname(message.nickname);
    if (nickname === null) {
      this.fail(session, ErrorCode.InvalidNickname);
      return;
    }
    this.releaseDroppedSeats();
    const held = this.sessionsByToken.get(message.resumeToken);
    if (held !== undefined && held !== session && !session.isIdentified) {
      this.resume(connection, held);
      return;
    }
    session.nickname = nickname;
    if (session.resumeToken === '') {
      session.resumeToken = this.createResumeToken();
      this.sessionsByToken.set(session.resumeToken, session);
    }
    this.welcome(session, false);
    this.logger.info('Client identified', { clientId: session.id, nickname });
  }

  private resume(connection: ClientConnection, held: ClientSession): void {
    this.clientIds.release(connection.session.id);
    held.close();
    held.bind(connection.channel);
    connection.session = held;
    this.welcome(held, true);
    this.inRoom(held, (room) => {
      room.resume(held);
    });
    this.logger.info('Client resumed', { clientId: held.id });
  }

  private welcome(session: ClientSession, resumed: boolean): void {
    session.send({
      type: ServerMessageType.Welcome,
      clientId: session.id,
      protocolVersion: NETWORK.protocolVersion,
      resumeToken: session.resumeToken,
      resumed,
    });
  }

  private releaseDroppedSeats(): void {
    for (const session of this.sessionsByToken.values()) {
      if (!session.isConnected && session.room === null) {
        this.release(session);
      }
    }
  }

  private serverTickOf(session: ClientSession): number {
    const match = this.matchOf(session);
    return match === null ? 0 : match.tick;
  }

  private forget(session: ClientSession): void {
    this.leaveRoom(session);
    this.release(session);
  }

  private release(session: ClientSession): void {
    this.sessionsByToken.delete(session.resumeToken);
    this.clientIds.release(session.id);
  }

  private route(session: ClientSession, message: ClientMessage): void {
    switch (message.type) {
      case ClientMessageType.CreateRoom:
        this.leaveRoom(session);
        this.rooms.create().join(session);
        return;
      case ClientMessageType.JoinRoom:
        this.joinRoom(session, message.code);
        return;
      case ClientMessageType.LeaveRoom:
        this.leaveRoom(session);
        return;
      case ClientMessageType.SelectHero:
        this.inRoom(session, (room) => {
          room.selectHero(session, message.hero);
        });
        return;
      case ClientMessageType.SetReady:
        this.inRoom(session, (room) => {
          room.setReady(session, message.ready);
        });
        return;
      case ClientMessageType.SetBotCount:
        this.inRoom(session, (room) => {
          room.setBotCount(session, message.count);
        });
        return;
      case ClientMessageType.PlayerInput:
        this.inMatch(session, (match) => {
          match.enqueueInput(session.id, message);
        });
        return;
      case ClientMessageType.SwitchWeapon:
        this.inMatch(session, (match) => {
          match.switchWeapon(session.id, message.weapon);
        });
        return;
      case ClientMessageType.Purchase:
        this.inMatch(session, (match) => {
          match.purchase(session, message.offer);
        });
        return;
      case ClientMessageType.SetPaused:
        this.inMatch(session, (match) => {
          match.setPaused(session.id, message.paused);
        });
        return;
      case ClientMessageType.VoteSkipIntermission:
        this.inMatch(session, (match) => {
          match.voteSkipIntermission(session.id);
        });
        return;
      case ClientMessageType.Hello:
      case ClientMessageType.Ping:
        return;
    }
  }

  private inRoom(session: ClientSession, action: (room: Room) => void): void {
    if (session.room !== null) {
      action(session.room);
    }
  }

  private inMatch(session: ClientSession, action: (match: MatchRunner) => void): void {
    const match = this.matchOf(session);
    if (match !== null) {
      action(match);
    }
  }

  private matchOf(session: ClientSession): MatchRunner | null {
    return session.room === null ? null : session.room.activeMatch;
  }

  private leaveRoom(session: ClientSession): void {
    this.inRoom(session, (room) => {
      room.leave(session);
    });
  }

  private joinRoom(session: ClientSession, code: string): void {
    const target = this.rooms.find(code);
    if (target === undefined) {
      this.fail(session, ErrorCode.RoomNotFound);
      return;
    }
    if (target === session.room) {
      return;
    }
    this.leaveRoom(session);
    const error = target.join(session);
    if (error !== null) {
      this.fail(session, error);
    }
  }

  private fail(session: ClientSession, error: ErrorCode): void {
    session.send({ type: ServerMessageType.ErrorNotice, error });
  }
}
