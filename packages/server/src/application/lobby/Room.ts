import {
  BOT_RULES,
  DEFAULT_MATCH_SETTINGS,
  HERO_IDS,
  HeroId,
  ROOM_RULES,
} from '@graveshift/shared/config';
import type { MatchSettings } from '@graveshift/shared/config';
import { ErrorCode, ServerMessageType } from '@graveshift/shared/protocol';
import type { RoomMemberInfo, RoomStateMessage } from '@graveshift/shared/protocol';
import { isValidMatchSettings } from '@graveshift/shared/rules';
import { MapId } from '@graveshift/shared/world';
import { Match } from '../../domain/match/Match.ts';
import { MatchRunner } from '../match/MatchRunner.ts';
import type { Logger } from '../ports/Logger.ts';
import type { TickScheduler } from '../ports/TickScheduler.ts';
import type { ClientSession } from '../session/ClientSession.ts';
import type { RoomBot } from './RoomBot.ts';
import type { RoomMember } from './RoomMember.ts';

export interface RoomDependencies {
  readonly scheduler: TickScheduler;
  readonly logger: Logger;
  readonly nextSeed: () => number;
  readonly onEmpty: (room: Room) => void;
}

export class Room {
  readonly code: string;
  private readonly dependencies: RoomDependencies;
  private readonly members = new Map<number, RoomMember>();
  private bots: RoomBot[] = [];
  private requestedBotCount = 0;
  private hostId = 0;
  private settings: MatchSettings = { ...DEFAULT_MATCH_SETTINGS };
  private runner: MatchRunner | null = null;

  constructor(code: string, dependencies: RoomDependencies) {
    this.code = code;
    this.dependencies = dependencies;
  }

  get activeMatch(): MatchRunner | null {
    return this.runner;
  }

  join(session: ClientSession): ErrorCode | null {
    if (this.runner !== null) {
      return ErrorCode.MatchInProgress;
    }
    if (this.members.size >= ROOM_RULES.maxPlayers) {
      return ErrorCode.RoomFull;
    }
    this.members.set(session.id, { session, hero: this.firstFreeHero(), ready: false });
    if (this.members.size === 1) {
      this.hostId = session.id;
    }
    session.room = this;
    this.staffBots();
    this.broadcastState();
    return null;
  }

  leave(session: ClientSession): void {
    if (!this.members.delete(session.id)) {
      return;
    }
    session.room = null;
    if (this.runner !== null) {
      this.runner.removePlayer(session.id);
    }
    if (this.members.size === 0) {
      if (this.runner !== null) {
        this.runner.stop();
      }
      this.runner = null;
      this.dependencies.onEmpty(this);
      return;
    }
    if (this.hostId === session.id) {
      this.hostId = this.members.keys().next().value ?? 0;
    }
    this.staffBots();
    this.broadcastState();
    this.startIfEveryoneReady();
  }

  suspend(session: ClientSession): boolean {
    if (
      this.runner === null ||
      !this.members.has(session.id) ||
      !this.runner.hasPlayer(session.id)
    ) {
      return false;
    }
    this.runner.setConnected(session.id, false);
    return true;
  }

  resume(session: ClientSession): void {
    this.broadcastState();
    if (this.runner !== null) {
      this.runner.resume(session);
    }
  }

  selectHero(session: ClientSession, hero: HeroId): void {
    const member = this.members.get(session.id);
    if (member === undefined || this.runner !== null) {
      return;
    }
    member.hero = hero;
    this.staffBots();
    this.broadcastState();
  }

  setReady(session: ClientSession, ready: boolean): void {
    const member = this.members.get(session.id);
    if (member === undefined || this.runner !== null) {
      return;
    }
    member.ready = ready;
    this.broadcastState();
    this.startIfEveryoneReady();
  }

  setBotCount(session: ClientSession, count: number): void {
    if (session.id !== this.hostId || this.runner !== null) {
      return;
    }
    this.requestedBotCount = count;
    this.staffBots();
    this.broadcastState();
  }

  setMatchSettings(session: ClientSession, settings: MatchSettings): void {
    if (session.id !== this.hostId || this.runner !== null || !isValidMatchSettings(settings)) {
      return;
    }
    this.settings = { ...settings };
    this.broadcastState();
  }

  private staffBots(): void {
    const seats = Math.max(0, ROOM_RULES.maxPlayers - this.members.size);
    const count = Math.min(this.requestedBotCount, seats, BOT_RULES.maxBots);
    const freeHeroes = this.freeHeroes();
    this.bots = Array.from({ length: count }, (_, index) => ({
      id: ROOM_RULES.firstBotPlayerId + index,
      nickname: `Bot ${index + 1}`,
      hero: freeHeroes[index % Math.max(1, freeHeroes.length)] ?? HeroId.Pippin,
    }));
  }

  private startIfEveryoneReady(): void {
    const members = [...this.members.values()];
    if (this.runner !== null || members.length === 0 || !members.every((member) => member.ready)) {
      return;
    }
    const participants = this.roster().map(({ clientId, nickname, hero, isBot }) => ({
      id: clientId,
      nickname,
      hero,
      isBot,
    }));
    const match = new Match(
      participants,
      MapId.Graveyard,
      this.dependencies.nextSeed(),
      this.settings,
    );
    this.runner = new MatchRunner(match, {
      scheduler: this.dependencies.scheduler,
      logger: this.dependencies.logger,
      recipients: () => [...this.members.values()].map((member) => member.session),
      onFinished: () => {
        this.onMatchFinished();
      },
      onPlayersDropped: (playerIds) => {
        this.releaseAbsentMembers(playerIds);
      },
    });
    this.broadcastState();
    this.runner.start();
    this.dependencies.logger.info('Match started', {
      room: this.code,
      players: participants.length,
    });
  }

  private releaseAbsentMembers(playerIds: readonly number[]): void {
    for (const playerId of playerIds) {
      const member = this.members.get(playerId);
      if (member !== undefined && !member.session.isConnected) {
        this.leave(member.session);
      }
    }
  }

  private onMatchFinished(): void {
    this.runner = null;
    for (const member of this.members.values()) {
      member.ready = false;
    }
    const absent = [...this.members.values()].filter((member) => !member.session.isConnected);
    absent.forEach((member) => {
      this.leave(member.session);
    });
    this.broadcastState();
    this.dependencies.logger.info('Match finished', { room: this.code });
  }

  private freeHeroes(): HeroId[] {
    const taken = new Set([...this.members.values()].map((member) => member.hero));
    return HERO_IDS.filter((hero) => !taken.has(hero));
  }

  private firstFreeHero(): HeroId {
    return this.freeHeroes()[0] ?? HeroId.Pippin;
  }

  private roster(): RoomMemberInfo[] {
    return [
      ...[...this.members.values()].map((member) => ({
        clientId: member.session.id,
        nickname: member.session.nickname ?? '',
        hero: member.hero,
        ready: member.ready,
        isBot: false,
      })),
      ...this.bots.map((bot) => ({
        clientId: bot.id,
        nickname: bot.nickname,
        hero: bot.hero,
        ready: true,
        isBot: true,
      })),
    ];
  }

  private broadcastState(): void {
    const state: RoomStateMessage = {
      type: ServerMessageType.RoomState,
      code: this.code,
      hostId: this.hostId,
      inMatch: this.runner !== null,
      settings: this.settings,
      members: this.roster(),
    };
    for (const member of this.members.values()) {
      member.session.send(state);
    }
  }
}
