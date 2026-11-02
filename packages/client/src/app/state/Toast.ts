import type { ValueOf } from '@graveshift/shared/core';
export const ToastKind = {
  Info: 'info',
  Error: 'error',
  Achievement: 'achievement',
} as const;
export type ToastKind = ValueOf<typeof ToastKind>;

export interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly title: string;
  readonly text: string;
  readonly icon: string;
}

export interface Banner {
  readonly id: number;
  readonly title: string;
  readonly subtitle: string;
}
