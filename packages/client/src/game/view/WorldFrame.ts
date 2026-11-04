import type {
  EnemyKind,
  HeroId,
  MeleeWeaponId,
  PickupKind,
  RangedWeaponId,
} from '@graveshift/shared/config';
import type { EnemyAction, LifeState } from '@graveshift/shared/model';

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
  readonly melee: MeleeWeaponId;
  readonly furyProgress: number;
  readonly flags: number;
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
  readonly healthFraction: number;
  readonly wavesUntilReturn: number;
}

export interface WorldFrame {
  readonly players: readonly PlayerFrame[];
  readonly enemies: readonly EnemyFrame[];
  readonly pickups: readonly PickupFrame[];
  readonly merchant: MerchantFrame | null;
}
