import type { ValueOf } from '@graveshift/shared/core';
export const Locale = {
  Russian: 'ru',
  English: 'en',
} as const;
export type Locale = ValueOf<typeof Locale>;
export const LOCALES: readonly Locale[] = Object.values(Locale);
