import type { ValueOf } from '@graveshift/shared/core';
export const CameraMode = {
  Orbit: 'orbit',
  Follow: 'follow',
  Showcase: 'showcase',
} as const;
export type CameraMode = ValueOf<typeof CameraMode>;
