import type { FlagSet } from '../core/FlagSet.ts';
import type { ValueOf } from '../core/ValueOf.ts';

export const PlayerFlag = {
  Reloading: 1,
  Paused: 2,
  Firing: 4,
  Disconnected: 8,
} as const;
export type PlayerFlag = ValueOf<typeof PlayerFlag>;
export const PLAYER_FLAGS: readonly PlayerFlag[] = Object.values(PlayerFlag);

export type PlayerFlags = FlagSet<PlayerFlag>;
