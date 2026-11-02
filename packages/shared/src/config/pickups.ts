import type { ValueOf } from '../core/ValueOf.ts';

export const PickupKind = {
  Coins: 0,
  Heart: 1,
  Pumpkin: 2,
} as const;
export type PickupKind = ValueOf<typeof PickupKind>;
export const PICKUP_KINDS: readonly PickupKind[] = Object.values(PickupKind);

export const PickupEffect = {
  Coins: 0,
  Heal: 1,
} as const;
export type PickupEffect = ValueOf<typeof PickupEffect>;

export interface PickupDefinition {
  readonly kind: PickupKind;
  readonly effect: PickupEffect;
  readonly amount: number;
  readonly dropChance: number;
  readonly lifetimeSeconds: number;
}

export const PICKUP_RULES = {
  collectRadius: 0.8,
  pumpkinRegrowSeconds: 40,
  coinMagnetRadius: 2.6,
  coinMagnetSpeed: 7,
} as const;

export const PICKUPS: Readonly<Record<PickupKind, PickupDefinition>> = {
  [PickupKind.Coins]: {
    kind: PickupKind.Coins,
    effect: PickupEffect.Coins,
    amount: 15,
    dropChance: 0.3,
    lifetimeSeconds: 20,
  },
  [PickupKind.Heart]: {
    kind: PickupKind.Heart,
    effect: PickupEffect.Heal,
    amount: 30,
    dropChance: 0.06,
    lifetimeSeconds: 20,
  },
  [PickupKind.Pumpkin]: {
    kind: PickupKind.Pumpkin,
    effect: PickupEffect.Heal,
    amount: 45,
    dropChance: 0,
    lifetimeSeconds: Number.POSITIVE_INFINITY,
  },
};

export const DROPPABLE_PICKUP_KINDS: readonly PickupKind[] = PICKUP_KINDS.filter(
  (kind) => PICKUPS[kind].dropChance > 0,
);
