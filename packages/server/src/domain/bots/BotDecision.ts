export interface BotDecision {
  moveX: number;
  moveY: number;
  aim: number;
  fire: boolean;
}

export function createBotDecision(): BotDecision {
  return { moveX: 0, moveY: 0, aim: 0, fire: false };
}
