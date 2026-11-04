import type { ValueOf } from '@graveshift/shared/core';
export const ModelFit = {
  Height: 'height',
  Footprint: 'footprint',
  Longest: 'longest',
} as const;
export type ModelFit = ValueOf<typeof ModelFit>;

export interface ModelSpec {
  readonly url: string;
  readonly fit: ModelFit;
  readonly size: number;
}

const BASE = `${import.meta.env.BASE_URL}assets/kenney`;

export const KenneyPack = {
  Graveyard: 'graveyard-kit',
  Characters: 'mini-characters',
  Dungeon: 'mini-dungeon',
  Blasters: 'blaster-kit',
  Survival: 'survival-kit',
} as const;
export type KenneyPack = ValueOf<typeof KenneyPack>;

export function kenneyModel(
  pack: KenneyPack,
  file: string,
  fit: ModelFit,
  size: number,
): ModelSpec {
  return { url: `${BASE}/${pack}/${file}.glb`, fit, size };
}
