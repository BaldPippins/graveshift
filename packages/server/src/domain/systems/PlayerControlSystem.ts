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
      const consumed = this.consumeInputs(player);
      player.ticksWithoutInput = consumed > 0 ? 0 : player.ticksWithoutInput + 1;
      if (!this.canAct(player) || this.isStarved(player)) {
        this.settle(player);
      }
    }
  }

  private canAct(player: PlayerEntity): boolean {
    return player.isAlive && !player.isIdle;
  }

  private isStarved(player: PlayerEntity): boolean {
    return player.ticksWithoutInput > SIMULATION.inputStarvationTicks;
  }

  private settle(player: PlayerEntity): void {
    if (player.height !== 0 || player.verticalSpeed !== 0) {
      stepPlayerMotion(player, STANDING_STILL, player.hero.moveSpeed, this.world.map);
    }
  }

  private consumeInputs(player: PlayerEntity): number {
    const inputs = player.takeInputs(SIMULATION.maxInputsPerTick);
    for (const input of inputs) {
      player.lastInputSequence = input.sequence;
      player.viewTick = input.viewTick;
      if (!this.canAct(player)) {
        continue;
      }
      stepPlayerMotion(
        player,
        player.snared
          ? STANDING_STILL
          : {
              moveX: input.moveX,
              moveY: input.moveY,
              jump: hasBit(input.buttons, InputButton.Jump),
            },
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
    return inputs.length;
  }
}
