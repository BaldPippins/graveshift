import { NETWORK } from '@graveshift/shared/config';
import { decodeServerMessage, encodeClientMessage } from '@graveshift/shared/protocol';
import type { ClientMessage } from '@graveshift/shared/protocol';
import { signal } from '@preact/signals-core';
import type { ReadonlySignal } from '@preact/signals-core';
import { ConnectionStatus } from './ConnectionStatus.ts';
import { ServerMessageBus } from './ServerMessageBus.ts';

export function defaultServerUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${NETWORK.webSocketPath}`;
}

export class NetClient {
  readonly messages = new ServerMessageBus();
  private readonly statusState = signal<ConnectionStatus>(ConnectionStatus.Idle);
  private socket: WebSocket | null = null;
  private lastMessageTime = 0;

  get status(): ReadonlySignal<ConnectionStatus> {
    return this.statusState;
  }

  get lastMessageAt(): number {
    return this.lastMessageTime;
  }

  connect(url: string): Promise<void> {
    this.disconnect();
    this.statusState.value = ConnectionStatus.Connecting;
    const socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    this.socket = socket;
    return new Promise((resolve, reject) => {
      socket.addEventListener('open', () => {
        this.lastMessageTime = performance.now();
        this.statusState.value = ConnectionStatus.Open;
        resolve();
      });
      socket.addEventListener('message', (event: MessageEvent<unknown>) => {
        if (this.socket === socket) {
          this.receive(event.data);
        }
      });
      socket.addEventListener('close', () => {
        if (this.socket === socket) {
          this.socket = null;
          this.statusState.value = ConnectionStatus.Closed;
        }
        reject(new Error('Connection closed'));
      });
    });
  }

  send(message: ClientMessage): void {
    if (this.socket !== null && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(encodeClientMessage(message));
    }
  }

  disconnect(): void {
    const socket = this.socket;
    this.socket = null;
    if (socket !== null) {
      socket.close();
      this.statusState.value = ConnectionStatus.Closed;
    }
  }

  private receive(data: unknown): void {
    this.lastMessageTime = performance.now();
    if (!(data instanceof ArrayBuffer)) {
      return;
    }
    this.messages.emit(decodeServerMessage(new Uint8Array(data)));
  }
}
