import type { HeroId } from '../config/heroes.ts';
import type { MatchSettings } from '../config/matchSettings.ts';
import type { ValueOf } from '../core/ValueOf.ts';
import type { LoadoutState } from '../model/LoadoutState.ts';
import type { MatchSummary } from '../model/MatchSummary.ts';
import type { MatchPhase } from '../model/MatchPhase.ts';
import type { PurchaseRejection } from '../rules/PurchaseRejection.ts';
import type { LevelDefinition } from '../world/LevelDefinition.ts';
import type {
  EnemySnapshot,
  MerchantSnapshot,
  ObstacleSnapshot,
  PickupSnapshot,
  PlayerSnapshot,
  TrapSnapshot,
} from './EntitySnapshots.ts';
import type { ErrorCode } from './ErrorCode.ts';
import type { GameEvent } from './GameEvent.ts';

export const ServerMessageType = {
  Welcome: 0,
  ErrorNotice: 1,
  RoomState: 2,
  MatchStarted: 3,
  Snapshot: 4,
  LoadoutUpdate: 5,
  PurchaseRejected: 6,
  MatchEnded: 7,
  Pong: 8,
  ScoreboardUpdate: 9,
  LevelsUpdate: 10,
} as const;
export type ServerMessageType = ValueOf<typeof ServerMessageType>;
export const SERVER_MESSAGE_TYPES: readonly ServerMessageType[] = Object.values(ServerMessageType);

export interface WelcomeMessage {
  readonly type: typeof ServerMessageType.Welcome;
  readonly clientId: number;
  readonly protocolVersion: number;
  readonly resumeToken: string;
  readonly resumed: boolean;
  readonly levels: readonly LevelDefinition[];
}

export interface LevelsUpdateMessage {
  readonly type: typeof ServerMessageType.LevelsUpdate;
  readonly levels: readonly LevelDefinition[];
}

export interface ErrorNoticeMessage {
  readonly type: typeof ServerMessageType.ErrorNotice;
  readonly error: ErrorCode;
}

export interface RoomMemberInfo {
  readonly clientId: number;
  readonly nickname: string;
  readonly hero: HeroId;
  readonly ready: boolean;
  readonly isBot: boolean;
}

export interface RoomStateMessage {
  readonly type: typeof ServerMessageType.RoomState;
  readonly code: string;
  readonly hostId: number;
  readonly inMatch: boolean;
  readonly levelId: string;
  readonly settings: MatchSettings;
  readonly members: readonly RoomMemberInfo[];
}

export interface MatchStartedMessage {
  readonly type: typeof ServerMessageType.MatchStarted;
  readonly startTick: number;
  readonly resumed: boolean;
  readonly settings: MatchSettings;
  readonly level: LevelDefinition;
}

export interface SnapshotMessage {
  readonly type: typeof ServerMessageType.Snapshot;
  readonly tick: number;
  readonly phase: MatchPhase;
  readonly wave: number;
  readonly phaseTicksLeft: number;
  readonly enemiesRemaining: number;
  readonly players: readonly PlayerSnapshot[];
  readonly enemies: readonly EnemySnapshot[];
  readonly pickups: readonly PickupSnapshot[];
  readonly merchant: MerchantSnapshot | null;
  readonly obstacles: readonly ObstacleSnapshot[];
  readonly traps: readonly TrapSnapshot[];
  readonly events: readonly GameEvent[];
}

export interface ScoreboardEntry {
  readonly playerId: number;
  readonly score: number;
  readonly kills: number;
  readonly deaths: number;
  readonly revives: number;
}

export interface ScoreboardUpdateMessage {
  readonly type: typeof ServerMessageType.ScoreboardUpdate;
  readonly players: readonly ScoreboardEntry[];
}

export interface LoadoutUpdateMessage {
  readonly type: typeof ServerMessageType.LoadoutUpdate;
  readonly loadout: LoadoutState;
}

export interface PurchaseRejectedMessage {
  readonly type: typeof ServerMessageType.PurchaseRejected;
  readonly rejection: PurchaseRejection;
}

export interface MatchEndedMessage extends MatchSummary {
  readonly type: typeof ServerMessageType.MatchEnded;
}

export interface PongMessage {
  readonly type: typeof ServerMessageType.Pong;
  readonly clientTime: number;
  readonly serverTick: number;
}

export type ServerMessage =
  | WelcomeMessage
  | LevelsUpdateMessage
  | ErrorNoticeMessage
  | RoomStateMessage
  | MatchStartedMessage
  | SnapshotMessage
  | LoadoutUpdateMessage
  | ScoreboardUpdateMessage
  | PurchaseRejectedMessage
  | MatchEndedMessage
  | PongMessage;
