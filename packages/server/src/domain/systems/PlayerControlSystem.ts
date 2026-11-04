import { SIMULATION } from '@graveshift/shared/config';
import { hasBit } from '@graveshift/shared/core';
import { InputButton } from '@graveshift/shared/model';
import { STANDING_STILL, stepPlayerMotion } from '@graveshift/shared/rules';
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
      if (!this.canAct(player)) {
        this.settle(player);
      }
    }
  }

  private canAct(player: PlayerEntity): boolean {
    return player.isAlive && !player.isIdle;
  }

  private settle(player: PlayerEntity): void {
    if (player.height !== 0 || player.verticalSpeed !== 0) {
      stepPlayerMotion(player, STANDING_STILL, player.hero.moveSpeed, this.world.map);
    }
  }

  private consumeInputs(player: PlayerEntity): void {
    for (const input of player.takeInputs(SIMULATION.maxInputsPerTick)) {
      player.lastInputSequence = input.sequence;
      player.viewTick = input.viewTick;
      if (!this.canAct(player)) {
        continue;
      }
      stepPlayerMotion(
        player,
        { moveX: input.moveX, moveY: input.moveY, jump: hasBit(input.buttons, InputButton.Jump) },
        player.hero.moveSpeed,
        this.world.map,
      );
      player.aim = input.aim;
      player.triggerHeld = hasBit(input.buttons, InputButton.Fire);
      player.swingHeld = hasBit(input.buttons, InputButton.Melee);
      if (hasBit(input.buttons, InputButton.Reload)) {
        player.arsenal.startReload();
      }
    }
    if (!this.canAct(player)) {
      player.triggerHeld = false;
      player.swingHeld = false;
    }
  }
}
