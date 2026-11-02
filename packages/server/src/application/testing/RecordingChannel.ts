import { decodeServerMessage } from '@graveshift/shared/protocol';
import type { ServerMessage } from '@graveshift/shared/protocol';
import type { ClientChannel } from '../ports/ClientChannel.ts';

export class RecordingChannel implements ClientChannel {
  readonly received: ServerMessage[] = [];
  closed = false;

  send(message: ServerMessage): void {
    this.received.push(message);
  }

  sendEncoded(bytes: Uint8Array): void {
    this.received.push(decodeServerMessage(bytes));
  }

  close(): void {
    this.closed = true;
  }
}
