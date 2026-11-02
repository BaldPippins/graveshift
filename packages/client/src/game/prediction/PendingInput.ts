import type { MoveIntent } from '@graveshift/shared/rules';

export interface PendingInput extends MoveIntent {
  readonly sequence: number;
}
