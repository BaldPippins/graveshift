import { TypedEventBus } from '@graveshift/shared/core';
import type { ClientEvent } from './ClientEvent.ts';

export class ClientEventBus extends TypedEventBus<ClientEvent> {}
