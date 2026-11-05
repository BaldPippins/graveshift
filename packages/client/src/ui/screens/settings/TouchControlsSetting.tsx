import type { JSX } from 'preact';
import { TOUCH_CONTROLS_MODES } from '../../../meta/settings/Settings.ts';
import { SegmentedControl } from '../../components/SegmentedControl.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

export function TouchControlsSetting(): JSX.Element {
  const { commands, settings } = useServices();
  const text = useMessages().settings;
  return (
    <SettingRow label={text.touch}>
      <SegmentedControl
        ariaLabel={text.touch}
        options={TOUCH_CONTROLS_MODES}
        value={settings.current.value.touchControls}
        label={(option) => text.touchModes[option]}
        onChange={(touchControls) => {
          commands.updateSettings({ touchControls });
        }}
      />
    </SettingRow>
  );
}
