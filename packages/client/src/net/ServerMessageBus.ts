import { TypedEventBus } from '@graveshift/shared/core';
import type { ServerMessage } from '@graveshift/shared/protocol';

export class ServerMessageBus extends TypedEventBus<ServerMessage> {}
