import type { BinaryReader } from './BinaryReader.ts';
import type { BinaryWriter } from './BinaryWriter.ts';

export interface PayloadCodec<T> {
  write(writer: BinaryWriter, value: T): void;
  read(reader: BinaryReader): T;
}
