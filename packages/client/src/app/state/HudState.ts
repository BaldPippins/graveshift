import type { HeroId, MeleeWeaponId, RangedWeaponId } from '@graveshift/shared/config';
import type { LifeState, MatchPhase } from '@graveshift/shared/model';
import type { MerchantAccess } from '@graveshift/shared/rules';

export interface TeammateHud {
  readonly id: number;
  readonly nickname: string;
  readonly hero: HeroId;
  readonly healthFraction: number;
  readonly life: LifeState;
  readonly statusIcon: string;
  readonly isLocal: boolean;
  readonly coins: number;
  readonly pingMilliseconds: number | null;
}

export interface HudState {
  readonly health: number;
  readonly maxHealth: number;
  readonly healthFraction: number;
  readonly ownedWeapons: readonly RangedWeaponId[];
  readonly ammo: number;
  readonly magazineSize: number;
  readonly weapon: RangedWeaponId;
  readonly melee: MeleeWeaponId;
  readonly meleeCharge: number;
  readonly furyProgress: number;
  readonly reloading: boolean;
  readonly coins: number;
  readonly wave: number;
  readonly phase: MatchPhase;
  readonly phaseSecondsLeft: number;
  readonly enemiesRemaining: number;
  readonly life: LifeState;
  readonly bleedoutProgress: number;
  readonly reviveProgress: number;
  readonly merchantAccess: MerchantAccess;
  readonly merchantWavesAway: number;
  readonly teammates: readonly TeammateHud[];
}
