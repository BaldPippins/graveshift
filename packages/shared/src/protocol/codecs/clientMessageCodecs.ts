import { HERO_IDS } from '../../config/heroes.ts';
import { WAVE_COUNTS } from '../../config/matchSettings.ts';
import { WEAPON_IDS } from '../../config/weapons.ts';
import { CLIENT_MESSAGE_TYPES, ClientMessageType } from '../ClientMessage.ts';
import type { ClientMessage } from '../ClientMessage.ts';
import {
  dequantizeAngle,
  dequantizeAxis,
  quantizeAngle,
  quantizeAxis,
  quantizeMilliseconds,
} from '../quantization.ts';
import { createUnionCodec } from './createUnionCodec.ts';
import type { CodecRegistry } from './createUnionCodec.ts';
import { shopOfferCodec } from './fieldCodecs.ts';

const CLIENT_MESSAGE_CODECS: CodecRegistry<ClientMessage> = {
  [ClientMessageType.Hello]: {
    write: (w, m) => w.u16(m.protocolVersion).string(m.nickname).string(m.resumeToken),
    read: (r) => ({
      type: ClientMessageType.Hello,
      protocolVersion: r.u16(),
      nickname: r.string(),
      resumeToken: r.string(),
    }),
  },
  [ClientMessageType.CreateRoom]: {
    write: () => undefined,
    read: () => ({ type: ClientMessageType.CreateRoom }),
  },
  [ClientMessageType.JoinRoom]: {
    write: (w, m) => w.string(m.code),
    read: (r) => ({ type: ClientMessageType.JoinRoom, code: r.string() }),
  },
  [ClientMessageType.LeaveRoom]: {
    write: () => undefined,
    read: () => ({ type: ClientMessageType.LeaveRoom }),
  },
  [ClientMessageType.SelectHero]: {
    write: (w, m) => w.u8(m.hero),
    read: (r) => ({ type: ClientMessageType.SelectHero, hero: r.oneOf(HERO_IDS) }),
  },
  [ClientMessageType.SetReady]: {
    write: (w, m) => w.bool(m.ready),
    read: (r) => ({ type: ClientMessageType.SetReady, ready: r.bool() }),
  },
  [ClientMessageType.PlayerInput]: {
    write: (w, m) =>
      w
        .u32(m.sequence)
        .u32(m.viewTick)
        .i8(quantizeAxis(m.moveX))
        .i8(quantizeAxis(m.moveY))
        .u16(quantizeAngle(m.aim))
        .u8(m.buttons),
    read: (r) => ({
      type: ClientMessageType.PlayerInput,
      sequence: r.u32(),
      viewTick: r.u32(),
      moveX: dequantizeAxis(r.i8()),
      moveY: dequantizeAxis(r.i8()),
      aim: dequantizeAngle(r.u16()),
      buttons: r.u8(),
    }),
  },
  [ClientMessageType.SwitchWeapon]: {
    write: (w, m) => w.u8(m.weapon),
    read: (r) => ({ type: ClientMessageType.SwitchWeapon, weapon: r.oneOf(WEAPON_IDS) }),
  },
  [ClientMessageType.Purchase]: {
    write: (w, m) => {
      shopOfferCodec.write(w, m.offer);
    },
    read: (r) => ({ type: ClientMessageType.Purchase, offer: shopOfferCodec.read(r) }),
  },
  [ClientMessageType.SetPaused]: {
    write: (w, m) => w.bool(m.paused),
    read: (r) => ({ type: ClientMessageType.SetPaused, paused: r.bool() }),
  },
  [ClientMessageType.VoteSkipIntermission]: {
    write: () => undefined,
    read: () => ({ type: ClientMessageType.VoteSkipIntermission }),
  },
  [ClientMessageType.Ping]: {
    write: (w, m) => w.f64(m.clientTime).u16(quantizeMilliseconds(m.roundTripMilliseconds)),
    read: (r) => ({
      type: ClientMessageType.Ping,
      clientTime: r.f64(),
      roundTripMilliseconds: r.u16(),
    }),
  },
  [ClientMessageType.SetBotCount]: {
    write: (w, m) => w.u8(m.count),
    read: (r) => ({ type: ClientMessageType.SetBotCount, count: r.u8() }),
  },
  [ClientMessageType.SetMatchSettings]: {
    write: (w, m) => w.u8(m.settings.totalWaves).bool(m.settings.friendlyFire),
    read: (r) => ({
      type: ClientMessageType.SetMatchSettings,
      settings: { totalWaves: r.oneOf(WAVE_COUNTS), friendlyFire: r.bool() },
    }),
  },
  [ClientMessageType.ArmTrap]: {
    write: () => undefined,
    read: () => ({ type: ClientMessageType.ArmTrap }),
  },
};

export const clientMessageCodec = createUnionCodec(CLIENT_MESSAGE_CODECS, CLIENT_MESSAGE_TYPES);
