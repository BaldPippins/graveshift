import type { ValueOf } from '../core/ValueOf.ts';

export const TrapKind = {
  PowderKeg: 0,
  BearTrap: 1,
} as const;
export type TrapKind = ValueOf<typeof TrapKind>;
export const TRAP_KINDS: readonly TrapKind[] = Object.values(TrapKind);

export interface TrapDefinition {
  readonly kind: TrapKind;
  readonly price: number;
  readonly radius: number;
  readonly shootable: boolean;
}

export const TRAPS: Readonly<Record<TrapKind, TrapDefinition>> = {
  [TrapKind.PowderKeg]: { kind: TrapKind.PowderKeg, price: 100, radius: 0.35, shootable: true },
  [TrapKind.BearTrap]: { kind: TrapKind.BearTrap, price: 20, radius: 0.4, shootable: false },
};

export const TRAP_RULES = {
  reach: 1.4,
  priceStepWaves: 3,
  priceStepFraction: 0.5,
} as const;

export interface BlastSpec {
  readonly radius: number;
  readonly enemyDamage: number;
  readonly playerDamage: number;
  readonly obstacleDamage: number;
}

export const BLAST_SURVIVOR_HEALTH = {
  minFraction: 0.01,
  maxFraction: 0.03,
} as const;

export const POWDER_KEG_BLAST: BlastSpec = {
  radius: 2.8,
  enemyDamage: 400,
  playerDamage: 45,
  obstacleDamage: 1000,
};

export const BEAR_TRAP_RULES = {
  holdSeconds: 10,
  triggerRadius: 0.45,
  damageFraction: 0.1,
} as const;

export const OBSTACLE_RULES = {
  minRestoreWaves: 2,
  maxRestoreWaves: 3,
} as const;
