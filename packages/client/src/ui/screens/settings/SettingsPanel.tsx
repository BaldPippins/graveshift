import type { JSX } from 'preact';
import { ScreenFrame } from '../../components/ScreenFrame.tsx';
import { useMessages } from '../../useMessages.ts';
import { CameraAimLeadSetting } from './CameraAimLeadSetting.tsx';
import { FullscreenSetting } from './FullscreenSetting.tsx';
import { GraphicsSetting } from './GraphicsSetting.tsx';
import { LanguageSetting } from './LanguageSetting.tsx';
import { ResetProgressSetting } from './ResetProgressSetting.tsx';
import { ScreenShakeSetting } from './ScreenShakeSetting.tsx';
import { ShowFpsSetting } from './ShowFpsSetting.tsx';
import { SoundSetting } from './SoundSetting.tsx';
import { TouchControlsSetting } from './TouchControlsSetting.tsx';
import { VolumeSetting } from './VolumeSetting.tsx';

export interface SettingsPanelProps {
  readonly onBack: () => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  const text = useMessages().settings;
  return (
    <ScreenFrame title={text.title} onBack={props.onBack}>
      <div class="settings">
        <LanguageSetting />
        <SoundSetting />
        <VolumeSetting />
        <GraphicsSetting />
        <TouchControlsSetting />
        <ScreenShakeSetting />
        <CameraAimLeadSetting />
        <ShowFpsSetting />
        <FullscreenSetting />
        <ResetProgressSetting />
      </div>
    </ScreenFrame>
  );
}
