import type { JSX } from 'preact';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { Button } from './Button.tsx';

export function SoundToggle(): JSX.Element {
  const { commands, settings } = useServices();
  const messages = useMessages();
  const muted = settings.current.value.soundMuted;
  return (
    <Button
      variant={muted ? 'ghost' : 'primary'}
      title={muted ? messages.common.soundOn : messages.common.soundOff}
      onClick={() => {
        commands.updateSettings({ soundMuted: !muted });
      }}
    >
      {muted ? messages.settings.soundDisabled : messages.settings.soundEnabled}
    </Button>
  );
}
