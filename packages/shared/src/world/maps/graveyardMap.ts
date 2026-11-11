import { MapId } from '../MapDefinition.ts';
import type { MapDefinition } from '../MapDefinition.ts';
import { parseLevelDefinition } from '../validateLevelDefinition.ts';
import graveyard from './graveyard.json' with { type: 'json' };

export const GRAVEYARD_LEVEL = parseLevelDefinition(JSON.stringify(graveyard));

export const GRAVEYARD_MAP: MapDefinition = {
  id: MapId.Graveyard,
  rows: GRAVEYARD_LEVEL.rows,
};
