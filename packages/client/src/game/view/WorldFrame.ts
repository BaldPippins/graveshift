import type {
  EnemyKind,
  HeroId,
  MeleeWeaponId,
  PickupKind,
  RangedWeaponId,
} from '@graveshift/shared/config';
import type { EnemyAction, LifeState, PlayerFlags, TrapState } from '@graveshift/shared/model';

export interface PlayerFrame {
  readonly id: number;
  readonly hero: HeroId;
  readonly nickname: string;
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly aim: number;
  readonly life: LifeState;
  readonly weapon: RangedWeaponId;
  readonly weaponGrade: number;
  readonly melee: MeleeWeaponId;
  readonly meleeGrade: number;
  readonly furyProgress: number;
  readonly flags: PlayerFlags;
  readonly reloadProgress: number;
  readonly moving: boolean;
  readonly reviveProgress: number;
  readonly healthFraction: number;
  readonly isLocal: boolean;
}

export interface EnemyFrame {
  readonly id: number;
  readonly kind: EnemyKind;
  readonly x: number;
  readonly y: number;
  readonly facing: number;
  readonly action: EnemyAction;
  readonly healthFraction: number;
  readonly moving: boolean;
}

export interface PickupFrame {
  readonly id: number;
  readonly kind: PickupKind;
  readonly x: number;
  readonly y: number;
}

export interface MerchantFrame {
  readonly x: number;
  readonly y: number;
  readonly moving: boolean;
  readonly healthFraction: number;
  readonly wavesUntilReturn: number;
}

export interface ObstacleFrame {
  readonly cell: number;
  readonly healthFraction: number;
  readonly wrecked: boolean;
}

export interface TrapFrame {
  readonly cell: number;
  readonly state: TrapState;
}

export interface WorldFrame {
  readonly wave: number;
  readonly players: readonly PlayerFrame[];
  readonly enemies: readonly EnemyFrame[];
  readonly pickups: readonly PickupFrame[];
  readonly merchant: MerchantFrame | null;
  readonly obstacles: readonly ObstacleFrame[];
  readonly traps: readonly TrapFrame[];
}
