import type { ValueOf } from '@graveshift/shared/core';

export const AimGuideMode = {
  Hidden: 0,
  Aiming: 1,
  Firing: 2,
} as const;
export type AimGuideMode = ValueOf<typeof AimGuideMode>;
