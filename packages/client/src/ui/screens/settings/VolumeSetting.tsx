import type { JSX } from 'preact';
import { Slider } from '../../components/Slider.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

const VOLUME_STEPS = 20;

export function VolumeSetting(): JSX.Element {
  const { commands, settings } = useServices();
  const volume = settings.current.value.soundVolume;
  const text = useMessages().settings;
  return (
    <SettingRow as="label" label={text.volume}>
      <span class="setting__volume">
        <Slider
          min={0}
          max={VOLUME_STEPS}
          step={1}
          value={Math.round(volume * VOLUME_STEPS)}
          onInput={(value) => {
            commands.updateSettings({ soundVolume: value / VOLUME_STEPS });
          }}
        />
        <output>{Math.round(volume * 100)}%</output>
      </span>
    </SettingRow>
  );
}
