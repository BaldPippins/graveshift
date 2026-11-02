import type { ValueOf } from '@graveshift/shared/core';
export const ConnectionStatus = {
  Idle: 'idle',
  Connecting: 'connecting',
  Open: 'open',
  Closed: 'closed',
} as const;
export type ConnectionStatus = ValueOf<typeof ConnectionStatus>;
