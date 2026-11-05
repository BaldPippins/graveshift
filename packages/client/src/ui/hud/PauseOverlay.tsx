import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Button } from '../components/Button.tsx';
import { SettingsPanel } from '../screens/settings/SettingsPanel.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function PauseOverlay(): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().pause;
  const [showSettings, setShowSettings] = useState(false);
  if (showSettings) {
    return (
      <div class="overlay">
        <SettingsPanel
          onBack={() => {
            setShowSettings(false);
          }}
        />
      </div>
    );
  }
  return (
    <div class="overlay">
      <div class="panel pause">
        <h1 class="panel__title">{text.title}</h1>
        <p class="hint">{text.text}</p>
        <Button
          variant="primary"
          wide
          onClick={() => {
            commands.setPaused(false);
          }}
        >
          {text.resume}
        </Button>
        <Button
          wide
          onClick={() => {
            setShowSettings(true);
          }}
        >
          {text.settings}
        </Button>
        <Button
          variant="danger"
          wide
          onClick={() => {
            commands.leaveMatch();
          }}
        >
          {text.leave}
        </Button>
      </div>
    </div>
  );
}
