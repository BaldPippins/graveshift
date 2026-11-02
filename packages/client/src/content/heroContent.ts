import { HeroId } from '@graveshift/shared/config';
import { ModelKey } from '../assets/ModelKey.ts';

export interface HeroContent {
  readonly model: ModelKey;
  readonly color: string;
}

export const HERO_CONTENT: Readonly<Record<HeroId, HeroContent>> = {
  [HeroId.Pippin]: {
    model: ModelKey.HeroPippin,
    color: '#f0a050',
  },
  [HeroId.Watchman]: {
    model: ModelKey.HeroWatchman,
    color: '#5b8def',
  },
  [HeroId.Lamplighter]: {
    model: ModelKey.HeroLamplighter,
    color: '#f5d142',
  },
  [HeroId.Undertaker]: {
    model: ModelKey.HeroUndertaker,
    color: '#9b6bd6',
  },
  [HeroId.Agatha]: {
    model: ModelKey.HeroAgatha,
    color: '#7ed37a',
  },
};
