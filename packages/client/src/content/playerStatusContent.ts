import { hasFlag } from '@graveshift/shared/core';
import { LifeState, PlayerFlag } from '@graveshift/shared/model';
import type { PlayerFlags } from '@graveshift/shared/model';

export function playerStatusIcon(life: LifeState, flags: PlayerFlags): string {
  if (life === LifeState.Downed) {
    return '🆘';
  }
  if (life === LifeState.Dead) {
    return '⚰️';
  }
  if (hasFlag(flags, PlayerFlag.Disconnected)) {
    return '📡';
  }
  return hasFlag(flags, PlayerFlag.Paused) ? '⏸' : '';
}
