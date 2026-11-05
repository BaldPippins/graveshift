import { MapId } from '../MapDefinition.ts';
import type { MapDefinition } from '../MapDefinition.ts';
import { validateLevelDefinition } from '../validateLevelDefinition.ts';
import graveyard from './graveyard.json' with { type: 'json' };

const issues = validateLevelDefinition(graveyard);
if (issues.length > 0) {
  throw new Error(`Invalid graveyard geometry: ${JSON.stringify(issues)}`);
}

export const GRAVEYARD_MAP: MapDefinition = {
  id: MapId.Graveyard,
  rows: graveyard.rows,
};
