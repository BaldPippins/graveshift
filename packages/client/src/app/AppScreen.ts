import type { ValueOf } from '@graveshift/shared/core';
export const AppScreen = {
  Loading: 'loading',
  MainMenu: 'main-menu',
  Lobby: 'lobby',
  HeroSelect: 'hero-select',
  Game: 'game',
  Results: 'results',
  Achievements: 'achievements',
  Stats: 'stats',
  Settings: 'settings',
  HowToPlay: 'how-to-play',
} as const;
export type AppScreen = ValueOf<typeof AppScreen>;
