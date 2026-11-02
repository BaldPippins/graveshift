import { hasBit } from '@graveshift/shared/core';
import { LifeState, PlayerFlag } from '@graveshift/shared/model';

export function playerStatusIcon(life: LifeState, flags: number): string {
  if (life === LifeState.Downed) {
    return '🆘';
  }
  if (life === LifeState.Dead) {
    return '⚰️';
  }
  if (hasBit(flags, PlayerFlag.Disconnected)) {
    return '📡';
  }
  return hasBit(flags, PlayerFlag.Paused) ? '⏸' : '';
}
