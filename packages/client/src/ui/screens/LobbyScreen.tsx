import type { JSX } from 'preact';
import { AppScreen } from '../../app/AppScreen.ts';
import { Button } from '../components/Button.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { BotCountPicker } from './BotCountPicker.tsx';
import { FriendlyFireSetting } from './lobby/FriendlyFireSetting.tsx';
import { LobbyRoster } from './lobby/LobbyRoster.tsx';
import { RoomCode } from './lobby/RoomCode.tsx';
import { WaveCountPicker } from './lobby/WaveCountPicker.tsx';

export function LobbyScreen(): JSX.Element {
  const { ui, commands } = useServices();
  const messages = useMessages();
  const text = messages.lobby;
  const room = ui.room.value;
  if (room === null) {
    return <ScreenFrame title={messages.common.connecting}>{null}</ScreenFrame>;
  }
  const localId = ui.localClientId.value;
  const me = room.members.find((member) => member.clientId === localId);
  const ready = me !== undefined && me.ready;
  const humans = room.members.filter((member) => !member.isBot).length;
  return (
    <ScreenFrame
      title={text.title(room.code)}
      subtitle={text.subtitle}
      onBack={() => {
        commands.leaveRoom();
      }}
      side="left"
      footer={
        <>
          <Button
            onClick={() => {
              commands.navigate(AppScreen.HeroSelect);
            }}
          >
            {text.changeHero}
          </Button>
          <Button
            variant={ready ? 'danger' : 'primary'}
            onClick={() => {
              commands.setReady(!ready);
            }}
          >
            {ready ? text.notReady : text.ready}
          </Button>
        </>
      }
    >
      <RoomCode code={room.code} />
      <BotCountPicker
        humans={humans}
        bots={room.members.length - humans}
        editable={localId === room.hostId}
        onChange={(count) => {
          commands.setBotCount(count);
        }}
      />
      <WaveCountPicker room={room} localId={localId} />
      <FriendlyFireSetting room={room} localId={localId} />
      <LobbyRoster room={room} localId={localId} />
    </ScreenFrame>
  );
}
