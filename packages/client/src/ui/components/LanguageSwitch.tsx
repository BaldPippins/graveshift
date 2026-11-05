import type { JSX } from 'preact';
import { LOCALES } from '../../i18n/Locale.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { SegmentedControl } from './SegmentedControl.tsx';

export function LanguageSwitch(): JSX.Element {
  const { commands, settings } = useServices();
  const messages = useMessages();
  const current = settings.current.value.locale;
  return (
    <SegmentedControl
      ariaLabel={messages.common.language}
      options={LOCALES}
      value={current}
      label={(locale) => locale.toUpperCase()}
      onChange={(locale) => {
        commands.updateSettings({ locale });
      }}
    />
  );
}
