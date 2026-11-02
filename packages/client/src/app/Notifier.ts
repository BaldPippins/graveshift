import type { UiState } from './state/UiState.ts';
import { ToastKind } from './state/Toast.ts';
import type { Toast } from './state/Toast.ts';

const TOAST_SECONDS = 4;
const BANNER_SECONDS = 2.6;
const MAX_TOASTS = 4;

export class Notifier {
  private readonly ui: UiState;
  private nextId = 1;

  constructor(ui: UiState) {
    this.ui = ui;
  }

  info(title: string, text = '', icon = 'ℹ️'): void {
    this.push({ kind: ToastKind.Info, title, text, icon });
  }

  error(title: string, text = ''): void {
    this.push({ kind: ToastKind.Error, title, text, icon: '⚠️' });
  }

  achievement(title: string, text: string, icon: string): void {
    this.push({ kind: ToastKind.Achievement, title, text, icon });
  }

  banner(title: string, subtitle = ''): void {
    const id = this.nextId++;
    this.ui.banner.value = { id, title, subtitle };
    window.setTimeout(() => {
      const banner = this.ui.banner.value;
      if (banner !== null && banner.id === id) {
        this.ui.banner.value = null;
      }
    }, BANNER_SECONDS * 1000);
  }

  dismiss(id: number): void {
    this.ui.toasts.value = this.ui.toasts.value.filter((toast) => toast.id !== id);
  }

  private push(toast: Omit<Toast, 'id'>): void {
    const id = this.nextId++;
    this.ui.toasts.value = [...this.ui.toasts.value, { ...toast, id }].slice(-MAX_TOASTS);
    window.setTimeout(() => {
      this.dismiss(id);
    }, TOAST_SECONDS * 1000);
  }
}
