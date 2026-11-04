import type { JSX } from 'preact';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { ToggleSetting } from './ToggleSetting.tsx';

export function CameraAimLeadSetting(): JSX.Element {
  const { commands, settings } = useServices();
  const text = useMessages().settings;
  return (
    <ToggleSetting
      label={text.cameraAimLead}
      checked={settings.current.value.cameraAimLead}
      onChange={(cameraAimLead) => {
        commands.updateSettings({ cameraAimLead });
      }}
    />
  );
}
