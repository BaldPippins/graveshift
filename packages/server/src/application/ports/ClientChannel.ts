import type { ServerMessage } from '@graveshift/shared/protocol';

export interface ClientChannel {
  send(message: ServerMessage): void;
  sendEncoded(bytes: Uint8Array): void;
  close(): void;
}
