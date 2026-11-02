import type { SnapshotMessage } from '@graveshift/shared/protocol';
import type { LoadoutState, MatchSummary } from '@graveshift/shared/model';

export interface LoadoutChange {
  readonly playerId: number;
  readonly loadout: LoadoutState;
}

export interface MatchStepResult {
  readonly snapshot: SnapshotMessage;
  readonly loadoutChanges: readonly LoadoutChange[];
  readonly droppedPlayerIds: readonly number[];
  readonly summary: MatchSummary | null;
}
