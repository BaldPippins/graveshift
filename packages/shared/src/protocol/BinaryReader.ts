import { ProtocolError } from './ProtocolError.ts';

const textDecoder = new TextDecoder('utf-8', { fatal: true });

export class BinaryReader {
  private readonly view: DataView;
  private readonly bytes: Uint8Array;
  private offset = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get remaining(): number {
    return this.bytes.byteLength - this.offset;
  }

  u8(): number {
    this.require(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  i8(): number {
    this.require(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  u16(): number {
    this.require(2);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  u32(): number {
    this.require(4);
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  f32(): number {
    this.require(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    if (!Number.isFinite(value)) {
      throw new ProtocolError('Non-finite float');
    }
    return value;
  }

  f64(): number {
    this.require(8);
    const value = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    if (!Number.isFinite(value)) {
      throw new ProtocolError('Non-finite float');
    }
    return value;
  }

  bool(): boolean {
    const value = this.u8();
    if (value > 1) {
      throw new ProtocolError(`Invalid boolean byte ${value}`);
    }
    return value === 1;
  }

  string(): string {
    const length = this.u8();
    this.require(length);
    const slice = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    try {
      return textDecoder.decode(slice);
    } catch {
      throw new ProtocolError('Invalid UTF-8 string');
    }
  }

  oneOf<T extends number>(values: readonly T[]): T {
    const value = this.u8();
    const match = values.find((candidate) => candidate === value);
    if (match === undefined) {
      throw new ProtocolError(`Value ${value} is outside of the allowed set`);
    }
    return match;
  }

  list<T>(readItem: (reader: BinaryReader) => T, maxItems: number): T[] {
    const count = this.u16();
    if (count > maxItems) {
      throw new ProtocolError(`List of ${count} items exceeds limit ${maxItems}`);
    }
    return Array.from({ length: count }, () => readItem(this));
  }

  expectEnd(): void {
    if (this.remaining !== 0) {
      throw new ProtocolError(`${this.remaining} trailing bytes`);
    }
  }

  private require(bytes: number): void {
    if (this.offset + bytes > this.bytes.byteLength) {
      throw new ProtocolError('Unexpected end of message');
    }
  }
}
