import type { JSX } from 'preact';
import { LOCALES } from '../../i18n/Locale.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { Button } from './Button.tsx';

export function LanguageSwitch(): JSX.Element {
  const { commands, settings } = useServices();
  const messages = useMessages();
  const current = settings.current.value.locale;
  return (
    <div class="segmented" role="radiogroup" aria-label={messages.common.language}>
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant={locale === current ? 'primary' : 'ghost'}
          onClick={() => {
            commands.updateSettings({ locale });
          }}
        >
          {locale.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
