import type { ValueOf } from '@graveshift/shared/core';
export const ViewMode = {
  Menu: 'menu',
  Showcase: 'showcase',
  Game: 'game',
} as const;
export type ViewMode = ValueOf<typeof ViewMode>;
