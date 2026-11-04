import type { JSX } from 'preact';
import { GRAPHICS_QUALITIES } from '../../../meta/settings/Settings.ts';
import { SingleSelect } from '../../components/SingleSelect.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

export function GraphicsSetting(): JSX.Element {
  const { commands, settings } = useServices();
  const text = useMessages().settings;
  return (
    <SettingRow label={text.graphics}>
      <SingleSelect
        variant="segmented"
        options={GRAPHICS_QUALITIES}
        value={settings.current.value.quality}
        label={(option) => text.qualities[option]}
        onChange={(quality) => {
          commands.updateSettings({ quality });
        }}
      />
    </SettingRow>
  );
}
