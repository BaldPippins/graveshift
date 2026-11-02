export interface ConnectionRecoveryListener {
  readonly wantsResume: () => boolean;
  readonly onReconnecting: (attempt: number) => void;
  readonly onResumed: () => void;
  readonly onLost: () => void;
}

export const IGNORE_RECOVERY: ConnectionRecoveryListener = {
  wantsResume: () => false,
  onReconnecting: () => undefined,
  onResumed: () => undefined,
  onLost: () => undefined,
};
