import type { EnemyKind } from '../config/enemies.ts';
import type { HeroId } from '../config/heroes.ts';
import type { PickupKind } from '../config/pickups.ts';
import type { MeleeWeaponId, RangedWeaponId } from '../config/weapons.ts';
import type { EnemyAction } from '../model/EnemyAction.ts';
import type { LifeState } from '../model/LifeState.ts';

export interface PlayerSnapshot {
  readonly id: number;
  readonly hero: HeroId;
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly verticalSpeed: number;
  readonly aim: number;
  readonly health: number;
  readonly maxHealth: number;
  readonly life: LifeState;
  readonly weapon: RangedWeaponId;
  readonly ammo: number;
  readonly melee: MeleeWeaponId;
  readonly meleeCharge: number;
  readonly furyProgress: number;
  readonly flags: number;
  readonly reviveProgress: number;
  readonly bleedoutProgress: number;
  readonly coins: number;
  readonly pingMilliseconds: number;
  readonly lastInputSequence: number;
}

export interface EnemySnapshot {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly y: number;
  readonly facing: number;
  readonly healthFraction: number;
  readonly action: EnemyAction;
}

export interface PickupSnapshot {
  readonly id: number;
  readonly kind: PickupKind;
  readonly x: number;
  readonly y: number;
}

export interface MerchantSnapshot {
  readonly healthFraction: number;
  readonly wavesUntilReturn: number;
}
