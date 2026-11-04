import type { JSX } from 'preact';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { ToggleSetting } from './ToggleSetting.tsx';

export function ShowFpsSetting(): JSX.Element {
  const { commands, settings } = useServices();
  const text = useMessages().settings;
  return (
    <ToggleSetting
      label={text.showFps}
      checked={settings.current.value.showFps}
      onChange={(showFps) => {
        commands.updateSettings({ showFps });
      }}
    />
  );
}
