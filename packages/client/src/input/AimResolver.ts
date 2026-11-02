import type { ReadonlyVec2 } from '@graveshift/shared/core';

export interface AimResolver {
  screenToWorld(clientX: number, clientY: number): ReadonlyVec2 | null;
}
