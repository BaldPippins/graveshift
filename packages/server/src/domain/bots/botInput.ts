import { InputButton } from '@graveshift/shared/model';
import { ClientMessageType } from '@graveshift/shared/protocol';
import type { PlayerInputMessage } from '@graveshift/shared/protocol';
import type { BotDecision } from './BotDecision.ts';

export function botInput(
  decision: BotDecision,
  sequence: number,
  viewTick: number,
): PlayerInputMessage {
  return {
    type: ClientMessageType.PlayerInput,
    sequence,
    viewTick,
    moveX: decision.moveX,
    moveY: decision.moveY,
    aim: decision.aim,
    buttons: decision.fire ? InputButton.Fire : 0,
  };
}
