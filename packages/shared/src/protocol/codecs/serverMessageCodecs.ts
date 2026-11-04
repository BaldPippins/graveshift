import { MATCH_OUTCOMES } from '../../model/MatchOutcome.ts';
import { WAVE_COUNTS } from '../../config/matchSettings.ts';
import { MATCH_PHASES } from '../../model/MatchPhase.ts';
import { PurchaseRejection } from '../../rules/PurchaseRejection.ts';
import { MAP_IDS } from '../../world/MapDefinition.ts';
import { ERROR_CODES } from '../ErrorCode.ts';
import { SERVER_MESSAGE_TYPES, ServerMessageType } from '../ServerMessage.ts';
import type { ServerMessage } from '../ServerMessage.ts';
import { createUnionCodec } from './createUnionCodec.ts';
import type { CodecRegistry } from './createUnionCodec.ts';
import {
  enemySnapshotCodec,
  LIST_LIMITS,
  loadoutCodec,
  merchantSnapshotCodec,
  pickupSnapshotCodec,
  playerSnapshotCodec,
  playerStatsCodec,
  roomMemberCodec,
} from './fieldCodecs.ts';
import { gameEventCodec } from './gameEventCodecs.ts';

const PURCHASE_REJECTIONS: readonly PurchaseRejection[] = Object.values(PurchaseRejection);

const SERVER_MESSAGE_CODECS: CodecRegistry<ServerMessage> = {
  [ServerMessageType.Welcome]: {
    write: (w, m) => w.u16(m.clientId).u16(m.protocolVersion).string(m.resumeToken).bool(m.resumed),
    read: (r) => ({
      type: ServerMessageType.Welcome,
      clientId: r.u16(),
      protocolVersion: r.u16(),
      resumeToken: r.string(),
      resumed: r.bool(),
    }),
  },
  [ServerMessageType.ErrorNotice]: {
    write: (w, m) => w.u8(m.error),
    read: (r) => ({ type: ServerMessageType.ErrorNotice, error: r.oneOf(ERROR_CODES) }),
  },
  [ServerMessageType.RoomState]: {
    write: (w, m) =>
      w
        .string(m.code)
        .u16(m.hostId)
        .bool(m.inMatch)
        .u8(m.settings.totalWaves)
        .bool(m.settings.friendlyFire)
        .list(m.members, (writer, member) => {
          roomMemberCodec.write(writer, member);
        }),
    read: (r) => ({
      type: ServerMessageType.RoomState,
      code: r.string(),
      hostId: r.u16(),
      inMatch: r.bool(),
      settings: { totalWaves: r.oneOf(WAVE_COUNTS), friendlyFire: r.bool() },
      members: r.list((reader) => roomMemberCodec.read(reader), LIST_LIMITS.players),
    }),
  },
  [ServerMessageType.MatchStarted]: {
    write: (w, m) =>
      w
        .u8(m.mapId)
        .u32(m.startTick)
        .bool(m.resumed)
        .u8(m.settings.totalWaves)
        .bool(m.settings.friendlyFire),
    read: (r) => ({
      type: ServerMessageType.MatchStarted,
      mapId: r.oneOf(MAP_IDS),
      startTick: r.u32(),
      resumed: r.bool(),
      settings: { totalWaves: r.oneOf(WAVE_COUNTS), friendlyFire: r.bool() },
    }),
  },
  [ServerMessageType.Snapshot]: {
    write: (w, m) => {
      w.u32(m.tick).u8(m.phase).u8(m.wave).u16(m.phaseTicksLeft).u16(m.enemiesRemaining);
      w.list(m.players, (writer, player) => {
        playerSnapshotCodec.write(writer, player);
      });
      w.list(m.enemies, (writer, enemy) => {
        enemySnapshotCodec.write(writer, enemy);
      });
      w.list(m.pickups, (writer, pickup) => {
        pickupSnapshotCodec.write(writer, pickup);
      });
      w.bool(m.merchant !== null);
      if (m.merchant !== null) {
        merchantSnapshotCodec.write(w, m.merchant);
      }
      w.list(m.events, (writer, event) => {
        gameEventCodec.write(writer, event);
      });
    },
    read: (r) => ({
      type: ServerMessageType.Snapshot,
      tick: r.u32(),
      phase: r.oneOf(MATCH_PHASES),
      wave: r.u8(),
      phaseTicksLeft: r.u16(),
      enemiesRemaining: r.u16(),
      players: r.list((reader) => playerSnapshotCodec.read(reader), LIST_LIMITS.players),
      enemies: r.list((reader) => enemySnapshotCodec.read(reader), LIST_LIMITS.enemies),
      pickups: r.list((reader) => pickupSnapshotCodec.read(reader), LIST_LIMITS.pickups),
      merchant: r.bool() ? merchantSnapshotCodec.read(r) : null,
      events: r.list((reader) => gameEventCodec.read(reader), LIST_LIMITS.events),
    }),
  },
  [ServerMessageType.LoadoutUpdate]: {
    write: (w, m) => {
      loadoutCodec.write(w, m.loadout);
    },
    read: (r) => ({ type: ServerMessageType.LoadoutUpdate, loadout: loadoutCodec.read(r) }),
  },
  [ServerMessageType.PurchaseRejected]: {
    write: (w, m) => w.u8(m.rejection),
    read: (r) => ({
      type: ServerMessageType.PurchaseRejected,
      rejection: r.oneOf(PURCHASE_REJECTIONS),
    }),
  },
  [ServerMessageType.MatchEnded]: {
    write: (w, m) =>
      w
        .u8(m.outcome)
        .u8(m.wave)
        .u32(m.durationTicks)
        .list(m.stats, (writer, stats) => {
          playerStatsCodec.write(writer, stats);
        }),
    read: (r) => ({
      type: ServerMessageType.MatchEnded,
      outcome: r.oneOf(MATCH_OUTCOMES),
      wave: r.u8(),
      durationTicks: r.u32(),
      stats: r.list((reader) => playerStatsCodec.read(reader), LIST_LIMITS.players),
    }),
  },
  [ServerMessageType.Pong]: {
    write: (w, m) => w.f64(m.clientTime).u32(m.serverTick),
    read: (r) => ({ type: ServerMessageType.Pong, clientTime: r.f64(), serverTick: r.u32() }),
  },
};

export const serverMessageCodec = createUnionCodec(SERVER_MESSAGE_CODECS, SERVER_MESSAGE_TYPES);
