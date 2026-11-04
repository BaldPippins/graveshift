import type { JSX } from 'preact';
import { LanguageSwitch } from '../../components/LanguageSwitch.tsx';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

export function LanguageSetting(): JSX.Element {
  const messages = useMessages();
  return (
    <SettingRow label={messages.common.language}>
      <LanguageSwitch />
    </SettingRow>
  );
}
