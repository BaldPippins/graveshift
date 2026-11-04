import type { JSX } from 'preact';
import type { RoomStateMessage } from '@graveshift/shared/protocol';
import { WAVE_COUNTS } from '@graveshift/shared/config';
import { SingleSelect } from '../../components/SingleSelect.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export interface WaveCountPickerProps {
  readonly room: RoomStateMessage;
  readonly localId: number | null;
}

export function WaveCountPicker(props: WaveCountPickerProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().lobby;
  return (
    <div class="bot-picker">
      <span class="bot-picker__label">{text.waveCount}</span>
      <SingleSelect
        variant="radio"
        ariaLabel={text.waveCount}
        options={WAVE_COUNTS}
        value={props.room.settings.totalWaves}
        label={(count) => count}
        disabled={props.localId !== props.room.hostId || props.room.inMatch}
        onChange={(totalWaves) => {
          commands.setMatchSettings({ ...props.room.settings, totalWaves });
        }}
      />
    </div>
  );
}
