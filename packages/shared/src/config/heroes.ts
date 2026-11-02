import type { ValueOf } from '../core/ValueOf.ts';

export const HeroId = {
  Pippin: 0,
  Watchman: 1,
  Lamplighter: 2,
  Undertaker: 3,
  Agatha: 4,
} as const;
export type HeroId = ValueOf<typeof HeroId>;
export const HERO_IDS: readonly HeroId[] = Object.values(HeroId);

export interface HeroModifiers {
  readonly damageMultiplier: number;
  readonly fireRateMultiplier: number;
  readonly damageTakenMultiplier: number;
  readonly reviveSpeedMultiplier: number;
  readonly healthRegenPerSecond: number;
  readonly coinMultiplier: number;
}

export interface HeroDefinition {
  readonly id: HeroId;
  readonly maxHealth: number;
  readonly moveSpeed: number;
  readonly modifiers: HeroModifiers;
}

const NEUTRAL_MODIFIERS: HeroModifiers = {
  damageMultiplier: 1,
  fireRateMultiplier: 1,
  damageTakenMultiplier: 1,
  reviveSpeedMultiplier: 1,
  healthRegenPerSecond: 0,
  coinMultiplier: 1,
};

export const HEROES: Readonly<Record<HeroId, HeroDefinition>> = {
  [HeroId.Pippin]: {
    id: HeroId.Pippin,
    maxHealth: 150,
    moveSpeed: 3.9,
    modifiers: { ...NEUTRAL_MODIFIERS, damageTakenMultiplier: 0.8 },
  },
  [HeroId.Watchman]: {
    id: HeroId.Watchman,
    maxHealth: 115,
    moveSpeed: 4.2,
    modifiers: { ...NEUTRAL_MODIFIERS, damageMultiplier: 1.15 },
  },
  [HeroId.Lamplighter]: {
    id: HeroId.Lamplighter,
    maxHealth: 95,
    moveSpeed: 4.9,
    modifiers: { ...NEUTRAL_MODIFIERS, fireRateMultiplier: 1.2 },
  },
  [HeroId.Undertaker]: {
    id: HeroId.Undertaker,
    maxHealth: 105,
    moveSpeed: 4.2,
    modifiers: { ...NEUTRAL_MODIFIERS, coinMultiplier: 1.4 },
  },
  [HeroId.Agatha]: {
    id: HeroId.Agatha,
    maxHealth: 100,
    moveSpeed: 4.0,
    modifiers: { ...NEUTRAL_MODIFIERS, reviveSpeedMultiplier: 2.2, healthRegenPerSecond: 1.5 },
  },
};
