import type { JSX } from 'preact';
import { NETWORK } from '@graveshift/shared/config';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function ReconnectOverlay(): JSX.Element | null {
  const attempt = useServices().ui.reconnectAttempt.value;
  const text = useMessages().reconnect;
  if (attempt === null) {
    return null;
  }
  return (
    <div class="overlay">
      <div class="panel reconnect__panel">
        <span class="reconnect__icon">📡</span>
        <h1 class="panel__title">{text.title}</h1>
        <p class="hint">{text.text(attempt, NETWORK.reconnectDelaysMilliseconds.length)}</p>
      </div>
    </div>
  );
}
