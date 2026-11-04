import { SIMULATION } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import { encodeServerMessage, ServerMessageType } from '@graveshift/shared/protocol';
import type { PlayerInputMessage, ServerMessage } from '@graveshift/shared/protocol';
import type { ShopOffer } from '@graveshift/shared/rules';
import type { Match } from '../../domain/match/Match.ts';
import type { MatchStepResult } from '../../domain/match/MatchStepResult.ts';
import type { MatchSummary } from '@graveshift/shared/model';
import type { Logger } from '../ports/Logger.ts';
import type { ScheduledTask, TickScheduler } from '../ports/TickScheduler.ts';
import type { ClientSession } from '../session/ClientSession.ts';

export interface MatchRunnerDependencies {
  readonly scheduler: TickScheduler;
  readonly logger: Logger;
  readonly recipients: () => Iterable<ClientSession>;
  readonly onFinished: () => void;
  readonly onPlayersDropped: (playerIds: readonly number[]) => void;
}

export class MatchRunner {
  private readonly match: Match;
  private readonly dependencies: MatchRunnerDependencies;
  private task: ScheduledTask | null = null;

  constructor(match: Match, dependencies: MatchRunnerDependencies) {
    this.match = match;
    this.dependencies = dependencies;
  }

  get tick(): number {
    return this.match.tick;
  }

  start(): void {
    for (const session of this.dependencies.recipients()) {
      this.brief(session, false);
    }
    this.task = this.dependencies.scheduler.start(SIMULATION.tickMilliseconds, () => {
      this.advance();
    });
  }

  hasPlayer(playerId: number): boolean {
    return this.match.hasPlayer(playerId);
  }

  setConnected(playerId: number, connected: boolean): void {
    this.match.setConnected(playerId, connected);
  }

  resume(session: ClientSession): void {
    this.match.setConnected(session.id, true);
    this.brief(session, true);
  }

  enqueueInput(playerId: number, input: PlayerInputMessage): void {
    this.match.enqueueInput(playerId, input);
  }

  switchWeapon(playerId: number, weapon: WeaponId): void {
    this.match.switchWeapon(playerId, weapon);
  }

  setPaused(playerId: number, paused: boolean): void {
    this.match.setPaused(playerId, paused);
  }

  reportPing(playerId: number, pingMilliseconds: number): void {
    this.match.reportPing(playerId, pingMilliseconds);
  }

  voteSkipIntermission(playerId: number): void {
    this.match.voteSkipIntermission(playerId);
  }

  purchase(session: ClientSession, offer: ShopOffer): void {
    const rejection = this.match.purchase(session.id, offer);
    if (rejection !== null) {
      session.send({ type: ServerMessageType.PurchaseRejected, rejection });
    }
  }

  armTrap(session: ClientSession, cell: number): void {
    const rejection = this.match.armTrap(session.id, cell);
    if (rejection !== null) {
      session.send({ type: ServerMessageType.PurchaseRejected, rejection });
    }
  }

  removePlayer(playerId: number): void {
    this.match.removePlayer(playerId);
  }

  stop(): void {
    if (this.task === null) {
      return;
    }
    this.task.stop();
    this.task = null;
    this.match.dispose();
  }

  private brief(session: ClientSession, resumed: boolean): void {
    session.send({
      type: ServerMessageType.MatchStarted,
      mapId: this.match.mapId,
      startTick: this.match.tick,
      resumed,
      settings: this.match.settings,
    });
    session.send({ type: ServerMessageType.ScoreboardUpdate, players: this.match.scoreboard() });
    const loadout = this.match.loadoutOf(session.id);
    if (loadout !== undefined) {
      session.send({ type: ServerMessageType.LoadoutUpdate, loadout: loadout.loadout });
    }
  }

  private advance(): void {
    try {
      this.publish(this.match.step());
    } catch (error: unknown) {
      this.dependencies.logger.error('Match tick failed', { error, tick: this.match.tick });
      this.stop();
      this.dependencies.onFinished();
    }
  }

  private publish(result: MatchStepResult): void {
    const snapshotBytes = encodeServerMessage(result.snapshot);
    const recipients = [...this.dependencies.recipients()];
    for (const session of recipients) {
      session.sendEncoded(snapshotBytes);
    }
    if (result.scoreboardChanges.length > 0) {
      const bytes = encodeServerMessage({
        type: ServerMessageType.ScoreboardUpdate,
        players: result.scoreboardChanges,
      });
      for (const session of recipients) {
        session.sendEncoded(bytes);
      }
    }
    for (const change of result.loadoutChanges) {
      const owner = recipients.find((session) => session.id === change.playerId);
      if (owner !== undefined) {
        owner.send({ type: ServerMessageType.LoadoutUpdate, loadout: change.loadout });
      }
    }
    if (result.droppedPlayerIds.length > 0) {
      this.dependencies.onPlayersDropped(result.droppedPlayerIds);
    }
    if (result.summary !== null) {
      this.finish(result.summary, recipients);
    }
  }

  private finish(summary: MatchSummary, recipients: readonly ClientSession[]): void {
    this.stop();
    const message: ServerMessage = { type: ServerMessageType.MatchEnded, ...summary };
    const bytes = encodeServerMessage(message);
    for (const session of recipients) {
      session.sendEncoded(bytes);
    }
    this.dependencies.onFinished();
  }
}
