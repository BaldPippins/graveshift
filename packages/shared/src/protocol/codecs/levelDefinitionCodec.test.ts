import { describe, expect, it } from 'vitest';
import { GRAVEYARD_LEVEL } from '../../world/mapCatalog.ts';
import { BinaryReader } from '../BinaryReader.ts';
import { BinaryWriter } from '../BinaryWriter.ts';
import { levelDefinitionCodec } from './levelDefinitionCodec.ts';

describe('level definition codec', () => {
  it('preserves geometry and rules', () => {
    const writer = new BinaryWriter();
    levelDefinitionCodec.write(writer, GRAVEYARD_LEVEL);
    const reader = new BinaryReader(writer.finish());
    expect(levelDefinitionCodec.read(reader)).toEqual(GRAVEYARD_LEVEL);
    reader.expectEnd();
  });
});
