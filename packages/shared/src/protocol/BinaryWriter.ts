import { ProtocolError } from './ProtocolError.ts';

const MAX_STRING_BYTES = 255;
const textEncoder = new TextEncoder();

export class BinaryWriter {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset = 0;

  constructor(initialCapacity = 256) {
    this.buffer = new ArrayBuffer(initialCapacity);
    this.view = new DataView(this.buffer);
  }

  u8(value: number): this {
    this.ensure(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  i8(value: number): this {
    this.ensure(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  u16(value: number): this {
    this.ensure(2);
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  u32(value: number): this {
    this.ensure(4);
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  f32(value: number): this {
    this.ensure(4);
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  f64(value: number): this {
    this.ensure(8);
    this.view.setFloat64(this.offset, value, true);
    this.offset += 8;
    return this;
  }

  bool(value: boolean): this {
    return this.u8(value ? 1 : 0);
  }

  string(value: string): this {
    const bytes = textEncoder.encode(value);
    if (bytes.length > MAX_STRING_BYTES) {
      throw new ProtocolError(`String exceeds ${MAX_STRING_BYTES} bytes`);
    }
    this.u8(bytes.length);
    this.ensure(bytes.length);
    new Uint8Array(this.buffer, this.offset, bytes.length).set(bytes);
    this.offset += bytes.length;
    return this;
  }

  list<T>(items: readonly T[], writeItem: (writer: BinaryWriter, item: T) => void): this {
    this.u16(items.length);
    for (const item of items) {
      writeItem(this, item);
    }
    return this;
  }

  finish(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.buffer.slice(0, this.offset));
  }

  private ensure(bytes: number): void {
    const required = this.offset + bytes;
    if (required <= this.buffer.byteLength) {
      return;
    }
    let capacity = this.buffer.byteLength * 2;
    while (capacity < required) {
      capacity *= 2;
    }
    const grown = new ArrayBuffer(capacity);
    new Uint8Array(grown).set(new Uint8Array(this.buffer, 0, this.offset));
    this.buffer = grown;
    this.view = new DataView(grown);
  }
}
