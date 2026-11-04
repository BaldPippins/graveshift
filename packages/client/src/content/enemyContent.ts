import { EnemyKind } from '@graveshift/shared/config';
import { KenneyPack, kenneyModel, ModelFit, ownModel } from '../assets/ModelSpec.ts';
import type { ModelSpec } from '../assets/ModelSpec.ts';

export interface FlightStyle {
  readonly cruiseHeight: number;
  readonly diveHeight: number;
  readonly climbSharpness: number;
}

export interface EnemyContent {
  readonly model: ModelSpec;
  readonly icon: string;
  readonly opacity: number;
  readonly flight: FlightStyle | null;
}

const SOLID = 1;

function walker(model: ModelSpec, icon: string, opacity: number = SOLID): EnemyContent {
  return { model, icon, opacity, flight: null };
}

function flyer(model: ModelSpec, icon: string, flight: FlightStyle): EnemyContent {
  return { model, icon, opacity: SOLID, flight };
}

function graveyardCharacter(file: string, height: number): ModelSpec {
  return kenneyModel(KenneyPack.Graveyard, file, ModelFit.Height, height);
}

export const ENEMY_CONTENT: Readonly<Record<EnemyKind, EnemyContent>> = {
  [EnemyKind.Zombie]: walker(graveyardCharacter('character-zombie', 1), '🧟'),
  [EnemyKind.Skeleton]: walker(graveyardCharacter('character-skeleton', 0.95), '🦴'),
  [EnemyKind.Ghost]: walker(graveyardCharacter('character-ghost', 1), '👻', 0.65),
  [EnemyKind.Brute]: walker(
    kenneyModel(KenneyPack.Dungeon, 'character-orc', ModelFit.Height, 1.45),
    '🪓',
  ),
  [EnemyKind.Vampire]: walker(graveyardCharacter('character-vampire', 1.3), '🧛'),
  [EnemyKind.Bat]: flyer(ownModel('bat', ModelFit.Longest, 1.3), '🦇', {
    cruiseHeight: 1.35,
    diveHeight: 0.45,
    climbSharpness: 6,
  }),
};
