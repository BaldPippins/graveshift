import type { JSX } from 'preact';
import type { RoomStateMessage } from '@graveshift/shared/protocol';
import { WAVE_COUNTS } from '@graveshift/shared/config';
import { RadioOptions } from '../../components/RadioOptions.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export interface WaveCountPickerProps {
  readonly room: RoomStateMessage;
  readonly editable: boolean;
}

export function WaveCountPicker(props: WaveCountPickerProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().lobby;
  return (
    <div class="bot-picker">
      <span class="bot-picker__label">{text.waveCount}</span>
      <RadioOptions
        ariaLabel={text.waveCount}
        options={WAVE_COUNTS}
        value={props.room.settings.totalWaves}
        label={(count) => count}
        disabled={!props.editable}
        onChange={(totalWaves) => {
          commands.setMatchSettings({ ...props.room.settings, totalWaves });
        }}
      />
    </div>
  );
}
