import type { JSX } from 'preact';
import type { RoomStateMessage } from '@graveshift/shared/protocol';
import { Checkbox } from '../../components/Checkbox.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export interface FriendlyFireSettingProps {
  readonly room: RoomStateMessage;
  readonly editable: boolean;
}

export function FriendlyFireSetting(props: FriendlyFireSettingProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().lobby;
  return (
    <label class="bot-picker bot-picker--friendly-fire">
      <span class="bot-picker__label">{text.friendlyFire}</span>
      <Checkbox
        class="bot-picker__checkbox"
        checked={props.room.settings.friendlyFire}
        disabled={!props.editable}
        onChange={(friendlyFire) => {
          commands.setFriendlyFire(friendlyFire);
        }}
      />
    </label>
  );
}
