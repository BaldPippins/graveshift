import { POWDER_KEG_BLAST } from '@graveshift/shared/config';
import { distanceSquared, nearestTo } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
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

function hasEnemiesAround(keg: ReadonlyVec2, enemies: readonly ReadonlyVec2[]): boolean {
  return enemies.some((enemy) => distanceSquared(enemy, keg) <= POWDER_KEG_BLAST.radius ** 2);
}

export function buildBotSituation(view: BotWorldView): BotSituation {
  const standing = view.teammates.filter((teammate) => teammate.life === LifeState.Alive);
  const leader = nearestTo(view.self, standing, positionOf, {
    accept: (teammate) => teammate.isHuman,
  });
  const allies = standing.map(positionOf);
  const merchant = view.merchant === null ? [] : [view.merchant];
  return {
    self: view.self,
    allies: [...allies, ...merchant],
    swingBlockers: view.friendlyFire ? [...allies, ...merchant] : merchant,
    downedAllies: view.teammates
      .filter((teammate) => teammate.life === LifeState.Downed)
      .map(positionOf),
    enemies: view.enemies,
    meleeTargets: view.meleeTargets,
    idle: view.enemies.length === 0,
    heals: view.heals,
    coins: view.coins,
    idleKegs: view.kegs.filter((keg) => !hasEnemiesAround(keg, view.enemies)),
    healthFraction: view.healthFraction,
    leader: leader === null ? null : leader.position,
    errand: view.errand,
    meleeReach: view.meleeReach,
    meleeArcRadians: view.meleeArcRadians,
    hasRangedWeapon: view.hasRangedWeapon,
  };
}
