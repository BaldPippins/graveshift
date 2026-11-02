import type { ServerMessage } from '@graveshift/shared/protocol';
import type { Room } from '../lobby/Room.ts';
import type { ClientChannel } from '../ports/ClientChannel.ts';
import { DetachedChannel } from './DetachedChannel.ts';

const DETACHED: ClientChannel = new DetachedChannel();

export class ClientSession {
  readonly id: number;
  private channel: ClientChannel = DETACHED;
  nickname: string | null = null;
  resumeToken = '';
  room: Room | null = null;

  constructor(id: number) {
    this.id = id;
  }

  get isIdentified(): boolean {
    return this.nickname !== null;
  }

  get isConnected(): boolean {
    return this.channel !== DETACHED;
  }

  isBoundTo(channel: ClientChannel): boolean {
    return this.channel === channel;
  }

  bind(channel: ClientChannel): void {
    this.channel = channel;
  }

  unbind(): void {
    this.channel = DETACHED;
  }

  send(message: ServerMessage): void {
    this.channel.send(message);
  }

  sendEncoded(bytes: Uint8Array): void {
    this.channel.sendEncoded(bytes);
  }

  close(): void {
    this.channel.close();
  }
}
