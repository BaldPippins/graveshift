import {
  ENEMIES,
  MELEE_WEAPONS,
  NETWORK,
  PickupEffect,
  PICKUPS,
  TrapKind,
} from '@graveshift/shared/config';
import { fractionOf, SeededRandom } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { LifeState, MatchPhase, TrapState } from '@graveshift/shared/model';
import type { LoadoutState } from '@graveshift/shared/model';
import {
  ClientMessageType,
  decodeServerMessage,
  encodeClientMessage,
  GameEventType,
  ServerMessageType,
} from '@graveshift/shared/protocol';
import type {
  ClientMessage,
  PlayerSnapshot,
  ServerMessage,
  SnapshotMessage,
} from '@graveshift/shared/protocol';
import {
  furiousMeleeStats,
  isMerchantPresent,
  trapSpotsOf,
  MerchantAccess,
  merchantAccessFor,
} from '@graveshift/shared/rules';
import { parseTileMap } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';
import { createBotDecision } from '../../src/domain/bots/BotDecision.ts';
import { botInput } from '../../src/domain/bots/botInput.ts';
import { buildBotSituation, needsShopping } from '../../src/domain/bots/buildBotSituation.ts';
import { BotPilot } from '../../src/domain/bots/BotPilot.ts';
import { botShoppingList } from '../../src/domain/bots/botShoppingList.ts';
import type { SmokeReport } from './SmokeReport.ts';

const STALL_SAMPLE_TICKS = 30;
const STALL_DISTANCE = 0.2;

export class SmokeBot {
  readonly name: string;
  private readonly url: string;
  private socket: WebSocket | null = null;
  private clientId = 0;
  private sequence = 0;
  private roomCode: string | null = null;
  private lastPurchaseWave = 0;
  private loadout: LoadoutState | null = null;
  private level: LevelDefinition | null = null;
  private levelId = '';
  private friendlyFire = false;
  private pilot: BotPilot | null = null;
  private kegSpots = new Map<number, ReadonlyVec2>();
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private roundTripMilliseconds = 0;
  private readonly decision = createBotDecision();
  private wantsToMove = false;
  private stallSampleX = 0;
  private stallSampleY = 0;
  private stallSampleTick = 0;
  private readonly report: SmokeReport;
  private resolveFinished: (report: SmokeReport) => void = () => undefined;
  private rejectFinished: (error: Error) => void = () => undefined;

  constructor(name: string, url: string) {
    this.name = name;
    this.url = url;
    this.report = {
      name,
      kills: 0,
      shots: 0,
      maxWave: 0,
      purchases: 0,
      outcome: null,
      snapshots: 0,
      revives: 0,
      stalls: 0,
    };
  }

  get code(): string | null {
    return this.roomCode;
  }

  get progress(): SmokeReport {
    return this.report;
  }

  connect(joinCode: string | null): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.url);
      socket.binaryType = 'arraybuffer';
      this.socket = socket;
      socket.addEventListener('open', () => {
        this.send({
          type: ClientMessageType.Hello,
          protocolVersion: NETWORK.protocolVersion,
          nickname: this.name,
          resumeToken: '',
        });
      });
      socket.addEventListener('error', () => {
        reject(new Error(`${this.name}: socket error`));
      });
      socket.addEventListener('close', () => {
        clearInterval(this.pingTimer);
        this.rejectFinished(new Error(`${this.name}: connection closed before the match ended`));
      });
      socket.addEventListener('message', (event: MessageEvent) => {
        if (!(event.data instanceof ArrayBuffer)) {
          return;
        }
        const message = decodeServerMessage(new Uint8Array(event.data));
        if (message.type === ServerMessageType.Welcome) {
          this.clientId = message.clientId;
          this.startPinging();
          this.send(
            joinCode === null
              ? { type: ClientMessageType.CreateRoom }
              : { type: ClientMessageType.JoinRoom, code: joinCode },
          );
        }
        if (message.type === ServerMessageType.RoomState && this.roomCode === null) {
          this.roomCode = message.code;
          resolve(message.code);
        }
        this.handle(message);
      });
    });
  }

  ready(): Promise<SmokeReport> {
    this.send({ type: ClientMessageType.SetReady, ready: true });
    return new Promise((resolve, reject) => {
      this.resolveFinished = resolve;
      this.rejectFinished = reject;
    });
  }

  selectLevel(levelId: string): Promise<void> {
    if (levelId === this.levelId) {
      return Promise.resolve();
    }
    const socket = this.socket;
    if (socket === null) {
      return Promise.reject(new Error(`${this.name}: socket is not connected`));
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.removeEventListener('message', onMessage);
        reject(new Error(`${this.name}: level selection timed out`));
      }, 5000);
      const onMessage = (event: MessageEvent): void => {
        if (!(event.data instanceof ArrayBuffer)) {
          return;
        }
        const message = decodeServerMessage(new Uint8Array(event.data));
        if (message.type === ServerMessageType.RoomState && message.levelId === levelId) {
          clearTimeout(timeout);
          socket.removeEventListener('message', onMessage);
          resolve();
        }
      };
      socket.addEventListener('message', onMessage);
      this.send({ type: ClientMessageType.SelectLevel, levelId });
    });
  }

  close(): void {
    clearInterval(this.pingTimer);
    if (this.socket !== null) {
      this.socket.close();
    }
  }

  private startPinging(): void {
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      this.send({
        type: ClientMessageType.Ping,
        clientTime: performance.now(),
        roundTripMilliseconds: this.roundTripMilliseconds,
      });
    }, NETWORK.pingIntervalMilliseconds);
  }

  private handle(message: ServerMessage): void {
    switch (message.type) {
      case ServerMessageType.RoomState:
        this.levelId = message.levelId;
        return;
      case ServerMessageType.MatchStarted:
        this.level = message.level;
        this.friendlyFire = message.settings.friendlyFire;
        this.startPiloting(message.level);
        return;
      case ServerMessageType.LoadoutUpdate:
        this.loadout = message.loadout;
        return;
      case ServerMessageType.Snapshot:
        this.onSnapshot(message);
        return;
      case ServerMessageType.Pong:
        this.roundTripMilliseconds = performance.now() - message.clientTime;
        return;
      case ServerMessageType.MatchEnded:
        this.report.outcome = message.outcome;
        this.resolveFinished(this.report);
        return;
      case ServerMessageType.ErrorNotice:
        throw new Error(`${this.name}: server error ${message.error}`);
      default:
        return;
    }
  }

  private onSnapshot(snapshot: SnapshotMessage): void {
    this.report.snapshots += 1;
    if (snapshot.wave > this.report.maxWave) {
      this.report.maxWave = snapshot.wave;
      process.stdout.write(
        `${this.name}: wave ${snapshot.wave}, kills ${this.report.kills}, ` +
          `enemies ${snapshot.enemies.length}\n`,
      );
    }
    for (const event of snapshot.events) {
      if (event.type === GameEventType.EnemyKilled && event.killerId === this.clientId) {
        this.report.kills += 1;
      } else if (event.type === GameEventType.ShotFired && event.shooterId === this.clientId) {
        this.report.shots += 1;
      } else if (
        event.type === GameEventType.PlayerRevived &&
        event.reviverId === this.clientId &&
        event.playerId !== this.clientId
      ) {
        this.report.revives += 1;
      } else if (event.type === GameEventType.CoinsSpent && event.playerId === this.clientId) {
        this.report.purchases += 1;
      }
    }
    const me = snapshot.players.find((player) => player.id === this.clientId);
    if (me === undefined || me.life !== LifeState.Alive) {
      return;
    }
    if (snapshot.phase === MatchPhase.Intermission) {
      this.shop(snapshot, me);
    }
    this.trackStall(snapshot.tick, me.x, me.y);
    this.act(snapshot, me);
  }

  private armedKegs(snapshot: SnapshotMessage): ReadonlyVec2[] {
    return snapshot.traps.flatMap((trap) => {
      const keg = this.kegSpots.get(trap.cell);
      return trap.state === TrapState.Armed && keg !== undefined ? [keg] : [];
    });
  }

  private startPiloting(level: LevelDefinition): void {
    const map = parseTileMap(level);
    this.pilot = new BotPilot(map, new SeededRandom(this.clientId), this.clientId);
    this.kegSpots = new Map(
      trapSpotsOf(map)
        .filter((spot) => spot.kind === TrapKind.PowderKeg)
        .map((spot) => [spot.index, spot.center]),
    );
  }

  private trackStall(tick: number, x: number, y: number): void {
    if (tick - this.stallSampleTick < STALL_SAMPLE_TICKS) {
      return;
    }
    if (
      this.wantsToMove &&
      Math.hypot(x - this.stallSampleX, y - this.stallSampleY) < STALL_DISTANCE
    ) {
      this.report.stalls += 1;
    }
    this.stallSampleTick = tick;
    this.stallSampleX = x;
    this.stallSampleY = y;
  }

  private act(snapshot: SnapshotMessage, me: PlayerSnapshot): void {
    if (this.pilot === null) {
      return;
    }
    const baseMelee = me.melee === null ? null : MELEE_WEAPONS[me.melee].stats;
    const melee =
      baseMelee === null || me.furyProgress <= 0 ? baseMelee : furiousMeleeStats(baseMelee);
    const situation = buildBotSituation({
      self: me,
      teammates: snapshot.players
        .filter((player) => player !== me)
        .map((player) => ({ position: player, life: player.life, isHuman: false })),
      enemies: snapshot.enemies,
      meleeTargets: snapshot.enemies.filter((enemy) => !ENEMIES[enemy.kind].airborne),
      heals: snapshot.pickups.filter((pickup) => PICKUPS[pickup.kind].effect === PickupEffect.Heal),
      coins: snapshot.pickups.filter(
        (pickup) => PICKUPS[pickup.kind].effect === PickupEffect.Coins,
      ),
      healthFraction: fractionOf(me.health, me.maxHealth),
      kegs: this.armedKegs(snapshot),
      merchant: isMerchantPresent(snapshot.merchant) ? snapshot.merchant : null,
      errand: this.wantsToShop(snapshot) ? snapshot.merchant : null,
      meleeReach: melee === null ? 0 : melee.reach,
      meleeArcRadians: melee === null ? 0 : melee.arcRadians,
      hasRangedWeapon: me.weapon !== null,
      friendlyFire: this.friendlyFire,
    });
    this.pilot.decide(situation, this.decision);
    this.wantsToMove = this.decision.moveX !== 0 || this.decision.moveY !== 0;
    this.sequence += 1;
    this.send(botInput(this.decision, this.sequence, snapshot.tick));
  }

  private wantsToShop(snapshot: SnapshotMessage): boolean {
    return needsShopping(
      snapshot.phase === MatchPhase.Intermission,
      isMerchantPresent(snapshot.merchant),
      this.lastPurchaseWave,
      snapshot.wave,
    );
  }

  private shop(snapshot: SnapshotMessage, me: PlayerSnapshot): void {
    const access = merchantAccessFor(me, snapshot.merchant, isMerchantPresent(snapshot.merchant));
    if (
      !this.wantsToShop(snapshot) ||
      this.loadout === null ||
      this.level === null ||
      access !== MerchantAccess.Serving
    ) {
      if (
        snapshot.phase === MatchPhase.Intermission &&
        !isMerchantPresent(snapshot.merchant) &&
        this.lastPurchaseWave !== snapshot.wave
      ) {
        this.lastPurchaseWave = snapshot.wave;
        this.send({ type: ClientMessageType.VoteSkipIntermission });
      }
      return;
    }
    this.lastPurchaseWave = snapshot.wave;
    for (const offer of botShoppingList(this.loadout, me.health / me.maxHealth, {
      allowedWeapons: this.level.weapons.allowed,
      friendlyFire: this.friendlyFire,
    })) {
      this.send({ type: ClientMessageType.Purchase, offer });
    }
    this.send({ type: ClientMessageType.VoteSkipIntermission });
  }

  private send(message: ClientMessage): void {
    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(encodeClientMessage(message));
    }
  }
}
