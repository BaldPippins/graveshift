import type { MotionIntent } from '@graveshift/shared/rules';

export interface PendingInput extends MotionIntent {
  readonly sequence: number;
}
