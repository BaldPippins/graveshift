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
