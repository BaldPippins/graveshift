import { BinaryReader } from './BinaryReader.ts';
import { BinaryWriter } from './BinaryWriter.ts';
import type { ClientMessage } from './ClientMessage.ts';
import { clientMessageCodec } from './codecs/clientMessageCodecs.ts';
import { serverMessageCodec } from './codecs/serverMessageCodecs.ts';
import type { PayloadCodec } from './PayloadCodec.ts';
import type { ServerMessage } from './ServerMessage.ts';

function encode<T>(codec: PayloadCodec<T>, message: T): Uint8Array<ArrayBuffer> {
  const writer = new BinaryWriter();
  codec.write(writer, message);
  return writer.finish();
}

function decode<T>(codec: PayloadCodec<T>, bytes: Uint8Array): T {
  const reader = new BinaryReader(bytes);
  const message = codec.read(reader);
  reader.expectEnd();
  return message;
}

export function encodeClientMessage(message: ClientMessage): Uint8Array<ArrayBuffer> {
  return encode(clientMessageCodec, message);
}

export function decodeClientMessage(bytes: Uint8Array): ClientMessage {
  return decode(clientMessageCodec, bytes);
}

export function encodeServerMessage(message: ServerMessage): Uint8Array<ArrayBuffer> {
  return encode(serverMessageCodec, message);
}

export function decodeServerMessage(bytes: Uint8Array): ServerMessage {
  return decode(serverMessageCodec, bytes);
}
