import type { ValueOf } from '../core/ValueOf.ts';

export const EnemyKind = {
  Zombie: 0,
  Skeleton: 1,
  Ghost: 2,
  Brute: 3,
  Vampire: 4,
  Bat: 5,
} as const;
export type EnemyKind = ValueOf<typeof EnemyKind>;
export const ENEMY_KINDS: readonly EnemyKind[] = Object.values(EnemyKind);

export interface EnemyDefinition {
  readonly kind: EnemyKind;
  readonly maxHealth: number;
  readonly moveSpeed: number;
  readonly radius: number;
  readonly attackDamage: number;
  readonly attackReach: number;
  readonly attackIntervalSeconds: number;
  readonly bounty: number;
  readonly spawnCost: number;
  readonly spawnWeight: number;
  readonly firstWave: number;
  readonly phasesThroughWalls: boolean;
  readonly airborne: boolean;
  readonly bossOnly: boolean;
}

export const ENEMIES: Readonly<Record<EnemyKind, EnemyDefinition>> = {
  [EnemyKind.Zombie]: {
    kind: EnemyKind.Zombie,
    maxHealth: 60,
    moveSpeed: 1.5,
    radius: 0.34,
    attackDamage: 7,
    attackReach: 0.55,
    attackIntervalSeconds: 1.2,
    bounty: 6,
    spawnCost: 1,
    spawnWeight: 6,
    firstWave: 1,
    phasesThroughWalls: false,
    airborne: false,
    bossOnly: false,
  },
  [EnemyKind.Skeleton]: {
    kind: EnemyKind.Skeleton,
    maxHealth: 34,
    moveSpeed: 3.1,
    radius: 0.3,
    attackDamage: 5,
    attackReach: 0.5,
    attackIntervalSeconds: 0.75,
    bounty: 7,
    spawnCost: 1.3,
    spawnWeight: 4,
    firstWave: 2,
    phasesThroughWalls: false,
    airborne: false,
    bossOnly: false,
  },
  [EnemyKind.Ghost]: {
    kind: EnemyKind.Ghost,
    maxHealth: 45,
    moveSpeed: 2.3,
    radius: 0.32,
    attackDamage: 7,
    attackReach: 0.55,
    attackIntervalSeconds: 1,
    bounty: 9,
    spawnCost: 1.8,
    spawnWeight: 3,
    firstWave: 3,
    phasesThroughWalls: true,
    airborne: false,
    bossOnly: false,
  },
  [EnemyKind.Brute]: {
    kind: EnemyKind.Brute,
    maxHealth: 320,
    moveSpeed: 1.35,
    radius: 0.46,
    attackDamage: 22,
    attackReach: 0.7,
    attackIntervalSeconds: 1.6,
    bounty: 40,
    spawnCost: 6,
    spawnWeight: 1.2,
    firstWave: 4,
    phasesThroughWalls: false,
    airborne: false,
    bossOnly: false,
  },
  [EnemyKind.Vampire]: {
    kind: EnemyKind.Vampire,
    maxHealth: 2200,
    moveSpeed: 2.7,
    radius: 0.45,
    attackDamage: 20,
    attackReach: 0.75,
    attackIntervalSeconds: 0.9,
    bounty: 300,
    spawnCost: 0,
    spawnWeight: 0,
    firstWave: 10,
    phasesThroughWalls: false,
    airborne: false,
    bossOnly: true,
  },
  [EnemyKind.Bat]: {
    kind: EnemyKind.Bat,
    maxHealth: 26,
    moveSpeed: 3.6,
    radius: 0.3,
    attackDamage: 4,
    attackReach: 0.6,
    attackIntervalSeconds: 0.8,
    bounty: 8,
    spawnCost: 1.3,
    spawnWeight: 3,
    firstWave: 3,
    phasesThroughWalls: true,
    airborne: true,
    bossOnly: false,
  },
};
