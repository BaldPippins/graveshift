import { effect } from '@preact/signals-core';
import { NETWORK } from '@graveshift/shared/config';
import { ClientMessageType, ServerMessageType } from '@graveshift/shared/protocol';
import type { WelcomeMessage } from '@graveshift/shared/protocol';
import { ConnectionStatus } from '../net/ConnectionStatus.ts';
import type { NetClient } from '../net/NetClient.ts';
import { IGNORE_RECOVERY } from './ConnectionRecoveryListener.ts';
import type { ConnectionRecoveryListener } from './ConnectionRecoveryListener.ts';
import { HandshakeError } from './HandshakeError.ts';
import type { UiState } from './state/UiState.ts';

const SILENCE_CHECK_MILLISECONDS = 1000;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

export class ConnectionManager {
  private readonly net: NetClient;
  private readonly ui: UiState;
  private readonly serverUrl: string;
  private handshake: Promise<number> | null = null;
  private nickname = '';
  private resumeToken = '';
  private listener: ConnectionRecoveryListener = IGNORE_RECOVERY;
  private closingOnPurpose = false;
  private recovering = false;
  private pingTimer: number | undefined;
  private silenceTimer: number | undefined;

  constructor(net: NetClient, ui: UiState, serverUrl: string) {
    this.net = net;
    this.ui = ui;
    this.serverUrl = serverUrl;
    net.messages.on(ServerMessageType.Pong, (message) => {
      this.ui.pingMilliseconds.value = Math.round(performance.now() - message.clientTime);
    });
    effect(() => {
      if (net.status.value === ConnectionStatus.Closed) {
        this.onClosed();
      }
    });
  }

  watch(listener: ConnectionRecoveryListener): void {
    this.listener = listener;
  }

  ensureIdentified(nickname: string): Promise<number> {
    if (this.handshake !== null && this.net.status.value === ConnectionStatus.Open) {
      return this.handshake;
    }
    this.nickname = nickname;
    const attempt = this.identify().then((welcome) => welcome.clientId);
    this.handshake = attempt;
    attempt.catch(() => {
      if (this.handshake === attempt) {
        this.handshake = null;
      }
    });
    return attempt;
  }

  disconnect(): void {
    this.stopTimers();
    this.handshake = null;
    this.resumeToken = '';
    this.closingOnPurpose = true;
    this.net.disconnect();
    this.closingOnPurpose = false;
  }

  private onClosed(): void {
    this.stopTimers();
    if (this.closingOnPurpose || this.recovering || this.handshake === null) {
      return;
    }
    this.handshake = null;
    if (this.resumeToken === '' || !this.listener.wantsResume()) {
      this.listener.onLost();
      return;
    }
    void this.recover();
  }

  private async recover(): Promise<void> {
    this.recovering = true;
    try {
      for (const [index, delay] of NETWORK.reconnectDelaysMilliseconds.entries()) {
        this.listener.onReconnecting(index + 1);
        await wait(delay);
        const welcome = await this.identify().catch(() => null);
        if (welcome === null) {
          continue;
        }
        this.handshake = Promise.resolve(welcome.clientId);
        if (welcome.resumed) {
          this.listener.onResumed();
        } else {
          this.listener.onLost();
        }
        return;
      }
      this.listener.onLost();
    } finally {
      this.recovering = false;
    }
  }

  private async identify(): Promise<WelcomeMessage> {
    await this.net.connect(this.serverUrl);
    const welcome = this.awaitWelcome();
    this.net.send({
      type: ClientMessageType.Hello,
      protocolVersion: NETWORK.protocolVersion,
      nickname: this.nickname,
      resumeToken: this.resumeToken,
    });
    const message = await welcome;
    this.resumeToken = message.resumeToken;
    this.ui.levels.value = message.levels;
    this.startTimers();
    return message;
  }

  private startTimers(): void {
    this.stopTimers();
    this.pingTimer = window.setInterval(() => {
      this.net.send({
        type: ClientMessageType.Ping,
        clientTime: performance.now(),
        roundTripMilliseconds: this.ui.pingMilliseconds.value ?? 0,
      });
    }, NETWORK.pingIntervalMilliseconds);
    this.silenceTimer = window.setInterval(() => {
      if (performance.now() - this.net.lastMessageAt > NETWORK.silenceTimeoutMilliseconds) {
        this.net.disconnect();
      }
    }, SILENCE_CHECK_MILLISECONDS);
  }

  private stopTimers(): void {
    window.clearInterval(this.pingTimer);
    window.clearInterval(this.silenceTimer);
    this.pingTimer = undefined;
    this.silenceTimer = undefined;
  }

  private awaitWelcome(): Promise<WelcomeMessage> {
    return new Promise((resolve, reject) => {
      const unsubscribers = [
        this.net.messages.on(ServerMessageType.Welcome, (message) => {
          release();
          resolve(message);
        }),
        this.net.messages.on(ServerMessageType.ErrorNotice, (message) => {
          release();
          reject(new HandshakeError(message.error));
        }),
        this.net.status.subscribe((status) => {
          if (status === ConnectionStatus.Closed) {
            release();
            reject(new Error('Connection closed during handshake'));
          }
        }),
      ];
      const release = (): void => {
        unsubscribers.forEach((unsubscribe) => {
          unsubscribe();
        });
      };
    });
  }
}
