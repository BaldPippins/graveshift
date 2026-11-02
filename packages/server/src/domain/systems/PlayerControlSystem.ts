import { SIMULATION } from '@graveshift/shared/config';
import { hasBit } from '@graveshift/shared/core';
import { InputButton } from '@graveshift/shared/model';
import { stepPlayerMovement } from '@graveshift/shared/rules';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';

export class PlayerControlSystem {
  private readonly world: MatchWorld;

  constructor(world: MatchWorld) {
    this.world = world;
  }

  update(): void {
    for (const player of this.world.players.values()) {
      this.consumeInputs(player);
    }
  }

  private consumeInputs(player: PlayerEntity): void {
    for (const input of player.takeInputs(SIMULATION.maxInputsPerTick)) {
      player.lastInputSequence = input.sequence;
      player.viewTick = input.viewTick;
      if (!player.isAlive || player.isIdle) {
        continue;
      }
      stepPlayerMovement(player.position, input, player.hero.moveSpeed, this.world.map);
      player.aim = input.aim;
      player.triggerHeld = hasBit(input.buttons, InputButton.Fire);
      if (hasBit(input.buttons, InputButton.Reload)) {
        player.arsenal.startReload();
      }
    }
    if (!player.isAlive || player.isIdle) {
      player.triggerHeld = false;
    }
  }
}
