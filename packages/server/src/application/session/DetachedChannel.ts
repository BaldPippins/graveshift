import type { ClientChannel } from '../ports/ClientChannel.ts';

export class DetachedChannel implements ClientChannel {
  send(): void {
    return;
  }

  sendEncoded(): void {
    return;
  }

  close(): void {
    return;
  }
}
