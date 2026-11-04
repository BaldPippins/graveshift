import { TRAP_KINDS, TRAP_RULES, TRAPS, TrapKind } from '../config/traps.ts';
import type { BlastSpec } from '../config/traps.ts';
import type { ReadonlyVec2 } from '../core/Vec2.ts';
import { distanceSquared } from '../core/vectorMath.ts';
import { LifeState } from '../model/LifeState.ts';
import { cellCenter } from '../world/cellMath.ts';
import { CollisionLayer } from '../world/CollisionLayer.ts';
import { TileKind } from '../world/TileKind.ts';
import type { TileMap } from '../world/TileMap.ts';
import { TILE_TRAITS } from '../world/tileTraits.ts';
import { PurchaseRejection } from './PurchaseRejection.ts';
import type { TrapSpot } from './TrapSpot.ts';

export interface TrapArmingContext {
  readonly spot: TrapSpot | null;
  readonly armed: boolean;
  readonly coins: number;
  readonly lifeState: LifeState;
  readonly wave: number;
}

const TRAP_SPOT_TILES: Readonly<Record<TrapKind, TileKind>> = {
  [TrapKind.PowderKeg]: TileKind.PowderKegSpot,
  [TrapKind.BearTrap]: TileKind.BearTrapSpot,
};

export function trapPower(wave: number): number {
  const steps = Math.floor(Math.max(0, wave - 1) / TRAP_RULES.priceStepWaves);
  return 1 + steps * TRAP_RULES.priceStepFraction;
}

export function trapPrice(kind: TrapKind, wave: number): number {
  return Math.round(TRAPS[kind].price * trapPower(wave));
}

export function strongerBlast(blast: BlastSpec, power: number): BlastSpec {
  return {
    radius: blast.radius,
    enemyDamage: blast.enemyDamage * power,
    playerDamage: blast.playerDamage * power,
    obstacleDamage: blast.obstacleDamage,
  };
}

export function trapSpotsOf(map: TileMap): TrapSpot[] {
  return TRAP_KINDS.flatMap((kind) =>
    map.cellsOfKind(TRAP_SPOT_TILES[kind]).map((cell) => ({
      kind,
      cell,
      index: map.indexOf(cell.cx, cell.cy),
      center: cellCenter(cell),
    })),
  );
}

export function isSolidTrapSpot(spot: TrapSpot): boolean {
  return TILE_TRAITS[TRAP_SPOT_TILES[spot.kind]].blocks[CollisionLayer.Movement];
}

export function trapSpotNear(position: ReadonlyVec2, spots: readonly TrapSpot[]): TrapSpot | null {
  let nearest: TrapSpot | null = null;
  let nearestDistance = TRAP_RULES.reach ** 2;
  for (const spot of spots) {
    const distance = distanceSquared(position, spot.center);
    if (distance <= nearestDistance) {
      nearest = spot;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function trapArmingRejection(context: TrapArmingContext): PurchaseRejection | null {
  if (context.spot === null) {
    return PurchaseRejection.TrapTooFar;
  }
  if (context.lifeState !== LifeState.Alive) {
    return PurchaseRejection.NotAlive;
  }
  if (context.armed) {
    return PurchaseRejection.TrapArmed;
  }
  return context.coins < trapPrice(context.spot.kind, context.wave)
    ? PurchaseRejection.NotEnoughCoins
    : null;
}
