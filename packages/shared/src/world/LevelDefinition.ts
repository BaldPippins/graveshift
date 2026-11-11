import type { EnemyKind, HeroId, WaveRules, WeaponId } from '../config/index.ts';
import type { LevelGeometry } from './LevelGeometry.ts';

export interface LevelEnemy {
  readonly kind: EnemyKind;
  readonly weight: number;
  readonly firstWave: number;
}

export interface LevelWaves extends WaveRules {
  readonly allowedTotals: readonly number[];
  readonly enemies: readonly LevelEnemy[];
}

export interface LevelTeam {
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly heroes: readonly HeroId[];
}

export interface LevelWeapons {
  readonly allowed: readonly WeaponId[];
  readonly starting: readonly WeaponId[];
}

export interface LevelDefinition extends LevelGeometry {
  readonly version: 1;
  readonly waves: LevelWaves;
  readonly team: LevelTeam;
  readonly weapons: LevelWeapons;
}
