import { nearestTo } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import type { BotSituation } from './BotSituation.ts';
import type { BotTeammate, BotWorldView } from './BotWorldView.ts';

function positionOf(teammate: BotTeammate): BotTeammate['position'] {
  return teammate.position;
}

export function needsShopping(
  isIntermission: boolean,
  merchantPresent: boolean,
  shoppedWave: number | undefined,
  wave: number,
): boolean {
  return isIntermission && merchantPresent && shoppedWave !== wave;
}

export function buildBotSituation(view: BotWorldView): BotSituation {
  const standing = view.teammates.filter((teammate) => teammate.life === LifeState.Alive);
  const leader = nearestTo(view.self, standing, positionOf, {
    accept: (teammate) => teammate.isHuman,
  });
  const allies = standing.map(positionOf);
  return {
    self: view.self,
    allies: view.merchant === null ? allies : [...allies, view.merchant],
    downedAllies: view.teammates
      .filter((teammate) => teammate.life === LifeState.Downed)
      .map(positionOf),
    enemies: view.enemies,
    idle: view.enemies.length === 0,
    heals: view.heals,
    healthFraction: view.healthFraction,
    leader: leader === null ? null : leader.position,
    errand: view.needsShopping ? view.merchant : null,
    meleeReach: view.meleeReach,
    meleeArcRadians: view.meleeArcRadians,
  };
}
