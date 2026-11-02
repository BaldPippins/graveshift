import { encodeServerMessage } from '@graveshift/shared/protocol';
import type { ServerMessage } from '@graveshift/shared/protocol';
import type { WebSocket } from 'ws';
import type { ClientChannel } from '../application/ports/ClientChannel.ts';

const MAX_BUFFERED_BYTES = 1024 * 1024;
const SLOW_CONSUMER_CLOSE_CODE = 1013;

export class WebSocketChannel implements ClientChannel {
  private readonly socket: WebSocket;

  constructor(socket: WebSocket) {
    this.socket = socket;
  }

  send(message: ServerMessage): void {
    this.sendEncoded(encodeServerMessage(message));
  }

  sendEncoded(bytes: Uint8Array): void {
    if (this.socket.readyState !== this.socket.OPEN) {
      return;
    }
    if (this.socket.bufferedAmount > MAX_BUFFERED_BYTES) {
      this.socket.close(SLOW_CONSUMER_CLOSE_CODE, 'Client is not keeping up');
      return;
    }
    this.socket.send(bytes, { binary: true });
  }

  close(): void {
    this.socket.close();
  }
}
