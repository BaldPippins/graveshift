import type { JSX } from 'preact';
import { ROOM_RULES } from '@graveshift/shared/config';
import { useMessages } from '../../useMessages.ts';

export interface RoomCodeProps {
  readonly code: string;
}

export function RoomCode(props: RoomCodeProps): JSX.Element {
  const text = useMessages().lobby;
  const shareCode = (): void => {
    void navigator.clipboard.writeText(props.code).catch(() => undefined);
  };
  return (
    <button type="button" class="room-code" onClick={shareCode} title={text.copyCode}>
      <span>{text.roomCode}</span>
      <strong>{props.code}</strong>
      <small>{text.copyHint(ROOM_RULES.maxPlayers)}</small>
    </button>
  );
}
