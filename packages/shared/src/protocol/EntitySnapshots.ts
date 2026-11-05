import type { EnemyKind } from '../config/enemies.ts';
import type { HeroId } from '../config/heroes.ts';
import type { PickupKind } from '../config/pickups.ts';
import type { MeleeWeaponId, RangedWeaponId } from '../config/weapons.ts';
import type { EnemyAction } from '../model/EnemyAction.ts';
import type { LifeState } from '../model/LifeState.ts';
import type { PlayerFlags } from '../model/PlayerFlag.ts';
import type { TrapState } from '../model/TrapState.ts';

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
  readonly weapon: RangedWeaponId | null;
  readonly ammo: number;
  readonly weaponGrade: number;
  readonly melee: MeleeWeaponId | null;
  readonly meleeGrade: number;
  readonly meleeCharge: number;
  readonly furyProgress: number;
  readonly flags: PlayerFlags;
  readonly reloadProgress: number;
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

export interface ObstacleSnapshot {
  readonly cell: number;
  readonly healthFraction: number;
  readonly wrecked: boolean;
}

export interface TrapSnapshot {
  readonly cell: number;
  readonly state: TrapState;
}

export interface MerchantSnapshot {
  readonly x: number;
  readonly y: number;
  readonly healthFraction: number;
  readonly wavesUntilReturn: number;
}
