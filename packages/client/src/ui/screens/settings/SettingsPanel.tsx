import type { JSX } from 'preact';
import { LanguageSwitch } from '../../components/LanguageSwitch.tsx';
import { ScreenFrame } from '../../components/ScreenFrame.tsx';
import { SoundToggle } from '../../components/SoundToggle.tsx';
import { useMessages } from '../../useMessages.ts';
import { BooleanSetting } from './BooleanSetting.tsx';
import { FullscreenSetting } from './FullscreenSetting.tsx';
import { GraphicsSetting } from './GraphicsSetting.tsx';
import { ResetProgressSetting } from './ResetProgressSetting.tsx';
import { SettingRow } from './SettingRow.tsx';
import { TouchControlsSetting } from './TouchControlsSetting.tsx';
import { VolumeSetting } from './VolumeSetting.tsx';

export interface SettingsPanelProps {
  readonly onBack: () => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  const messages = useMessages();
  const text = messages.settings;
  return (
    <ScreenFrame title={text.title} onBack={props.onBack}>
      <div class="settings">
        <SettingRow label={messages.common.language}>
          <LanguageSwitch />
        </SettingRow>
        <SettingRow label={text.sound}>
          <SoundToggle />
        </SettingRow>
        <VolumeSetting />
        <GraphicsSetting />
        <TouchControlsSetting />
        <BooleanSetting setting="screenShake" label={text.screenShake} />
        <BooleanSetting setting="cameraAimLead" label={text.cameraAimLead} />
        <BooleanSetting setting="showFps" label={text.showFps} />
        <FullscreenSetting />
        <ResetProgressSetting />
      </div>
    </ScreenFrame>
  );
}
