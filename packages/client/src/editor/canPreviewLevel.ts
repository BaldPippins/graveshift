import { validateLevelGeometry } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';

export function canPreviewLevel(level: LevelDefinition): boolean {
  return validateLevelGeometry(level).every((issue) => issue.code === 'disconnected');
}
