import type { JSX } from 'preact';
import { useServices } from '../../ServicesContext.ts';
import { ToggleSetting } from './ToggleSetting.tsx';

export interface BooleanSettingProps {
  readonly setting: 'screenShake' | 'cameraAimLead' | 'showFps';
  readonly label: string;
}

export function BooleanSetting(props: BooleanSettingProps): JSX.Element {
  const { commands, settings } = useServices();
  return (
    <ToggleSetting
      label={props.label}
      checked={settings.current.value[props.setting]}
      onChange={(value) => {
        commands.updateSettings({ [props.setting]: value });
      }}
    />
  );
}
