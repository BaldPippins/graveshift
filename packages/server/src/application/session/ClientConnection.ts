import type { ClientChannel } from '../ports/ClientChannel.ts';
import type { ClientSession } from './ClientSession.ts';

export class ClientConnection {
  readonly channel: ClientChannel;
  session: ClientSession;

  constructor(channel: ClientChannel, session: ClientSession) {
    this.channel = channel;
    this.session = session;
  }
}
