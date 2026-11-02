import type { TypedEvent } from '../../core/TypedEvent.ts';
import type { BinaryReader } from '../BinaryReader.ts';
import type { BinaryWriter } from '../BinaryWriter.ts';
import type { PayloadCodec } from '../PayloadCodec.ts';

export type CodecRegistry<TUnion extends TypedEvent<number>> = {
  readonly [TType in TUnion['type']]: PayloadCodec<Extract<TUnion, TypedEvent<TType>>>;
};

export function createUnionCodec<TUnion extends TypedEvent<number>>(
  registry: CodecRegistry<TUnion>,
  types: readonly TUnion['type'][],
): PayloadCodec<TUnion> {
  const codecFor = (type: TUnion['type']): PayloadCodec<TUnion> => registry[type];
  return {
    write(writer: BinaryWriter, value: TUnion): void {
      writer.u8(value.type);
      codecFor(value.type).write(writer, value);
    },
    read(reader: BinaryReader): TUnion {
      return codecFor(reader.oneOf(types)).read(reader);
    },
  };
}
