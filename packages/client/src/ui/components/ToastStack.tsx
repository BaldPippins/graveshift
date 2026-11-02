import type { JSX } from 'preact';
import { useServices } from '../ServicesContext.ts';

export function ToastStack(): JSX.Element {
  const { ui, commands } = useServices();
  return (
    <div class="toasts" aria-live="polite">
      {ui.toasts.value.map((toast) => (
        <div
          key={toast.id}
          class={`toast toast--${toast.kind}`}
          onClick={() => {
            commands.dismissToast(toast.id);
          }}
        >
          <span class="toast__icon">{toast.icon}</span>
          <div>
            <strong>{toast.title}</strong>
            {toast.text === '' ? null : <p>{toast.text}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
