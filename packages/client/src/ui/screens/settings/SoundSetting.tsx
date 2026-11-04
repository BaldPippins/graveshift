import type { JSX } from 'preact';
import { SoundToggle } from '../../components/SoundToggle.tsx';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

export function SoundSetting(): JSX.Element {
  const messages = useMessages();
  return (
    <SettingRow label={messages.settings.sound}>
      <SoundToggle />
    </SettingRow>
  );
}
