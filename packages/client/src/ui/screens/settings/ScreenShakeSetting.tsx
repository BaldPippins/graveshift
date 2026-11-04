import type { JSX } from 'preact';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { ToggleSetting } from './ToggleSetting.tsx';

export function ScreenShakeSetting(): JSX.Element {
  const { commands, settings } = useServices();
  const text = useMessages().settings;
  return (
    <ToggleSetting
      label={text.screenShake}
      checked={settings.current.value.screenShake}
      onChange={(screenShake) => {
        commands.updateSettings({ screenShake });
      }}
    />
  );
}
