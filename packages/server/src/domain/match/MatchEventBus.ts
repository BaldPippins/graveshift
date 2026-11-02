import { TypedEventBus } from '@graveshift/shared/core';
import type { GameEvent } from '@graveshift/shared/protocol';

export class MatchEventBus extends TypedEventBus<GameEvent> {}
