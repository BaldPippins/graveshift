import type { HeroId } from '../config/heroes.ts';
import type { MatchSettings } from '../config/matchSettings.ts';
import type { WeaponId } from '../config/weapons.ts';
import type { ValueOf } from '../core/ValueOf.ts';
import type { ShopOffer } from '../rules/ShopOffer.ts';

export const ClientMessageType = {
  Hello: 0,
  CreateRoom: 1,
  JoinRoom: 2,
  LeaveRoom: 3,
  SelectHero: 4,
  SetReady: 5,
  PlayerInput: 6,
  SwitchWeapon: 7,
  Purchase: 8,
  SetPaused: 9,
  VoteSkipIntermission: 10,
  Ping: 11,
  SetBotCount: 12,
  SetMatchSettings: 13,
} as const;
export type ClientMessageType = ValueOf<typeof ClientMessageType>;
export const CLIENT_MESSAGE_TYPES: readonly ClientMessageType[] = Object.values(ClientMessageType);

export interface HelloMessage {
  readonly type: typeof ClientMessageType.Hello;
  readonly protocolVersion: number;
  readonly nickname: string;
  readonly resumeToken: string;
}

export interface CreateRoomMessage {
  readonly type: typeof ClientMessageType.CreateRoom;
}

export interface JoinRoomMessage {
  readonly type: typeof ClientMessageType.JoinRoom;
  readonly code: string;
}

export interface LeaveRoomMessage {
  readonly type: typeof ClientMessageType.LeaveRoom;
}

export interface SelectHeroMessage {
  readonly type: typeof ClientMessageType.SelectHero;
  readonly hero: HeroId;
}

export interface SetReadyMessage {
  readonly type: typeof ClientMessageType.SetReady;
  readonly ready: boolean;
}

export interface PlayerInputMessage {
  readonly type: typeof ClientMessageType.PlayerInput;
  readonly sequence: number;
  readonly viewTick: number;
  readonly moveX: number;
  readonly moveY: number;
  readonly aim: number;
  readonly buttons: number;
}

export interface SwitchWeaponMessage {
  readonly type: typeof ClientMessageType.SwitchWeapon;
  readonly weapon: WeaponId;
}

export interface PurchaseMessage {
  readonly type: typeof ClientMessageType.Purchase;
  readonly offer: ShopOffer;
}

export interface SetPausedMessage {
  readonly type: typeof ClientMessageType.SetPaused;
  readonly paused: boolean;
}

export interface VoteSkipIntermissionMessage {
  readonly type: typeof ClientMessageType.VoteSkipIntermission;
}

export interface PingMessage {
  readonly type: typeof ClientMessageType.Ping;
  readonly clientTime: number;
  readonly roundTripMilliseconds: number;
}

export interface SetBotCountMessage {
  readonly type: typeof ClientMessageType.SetBotCount;
  readonly count: number;
}

export interface SetMatchSettingsMessage {
  readonly type: typeof ClientMessageType.SetMatchSettings;
  readonly settings: MatchSettings;
}

export type ClientMessage =
  | HelloMessage
  | CreateRoomMessage
  | JoinRoomMessage
  | LeaveRoomMessage
  | SelectHeroMessage
  | SetReadyMessage
  | PlayerInputMessage
  | SwitchWeaponMessage
  | PurchaseMessage
  | SetPausedMessage
  | VoteSkipIntermissionMessage
  | PingMessage
  | SetBotCountMessage
  | SetMatchSettingsMessage;
