import type { ValueOf } from '../core/ValueOf.ts';

export const ErrorCode = {
  VersionMismatch: 0,
  InvalidNickname: 1,
  RoomNotFound: 2,
  RoomFull: 3,
  MatchInProgress: 4,
  NotInRoom: 5,
  MalformedMessage: 6,
  HandshakeRequired: 7,
} as const;
export type ErrorCode = ValueOf<typeof ErrorCode>;
export const ERROR_CODES: readonly ErrorCode[] = Object.values(ErrorCode);
