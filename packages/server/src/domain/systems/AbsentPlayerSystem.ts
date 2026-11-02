import { NETWORK, SIMULATION } from '@graveshift/shared/config';
import { LifeState } from '@graveshift/shared/model';
import type { MatchWorld } from '../match/MatchWorld.ts';

export class AbsentPlayerSystem {
  private readonly world: MatchWorld;

  constructor(world: MatchWorld) {
    this.world = world;
  }

  collectExpired(): number[] {
    const expired: number[] = [];
    for (const player of this.world.players.values()) {
      if (player.connected) {
        continue;
      }
      player.disconnectedSeconds += SIMULATION.tickSeconds;
      if (player.life === LifeState.Dead || player.disconnectedSeconds >= NETWORK.seatHoldSeconds) {
        expired.push(player.id);
      }
    }
    return expired;
  }
}
