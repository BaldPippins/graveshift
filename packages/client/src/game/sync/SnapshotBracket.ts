import type { SnapshotMessage } from '@graveshift/shared/protocol';

export interface SnapshotBracket {
  readonly older: SnapshotMessage;
  readonly newer: SnapshotMessage;
  readonly alpha: number;
}
