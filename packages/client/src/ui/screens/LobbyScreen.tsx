import type { JSX } from 'preact';
import { ROOM_RULES, WAVE_COUNTS } from '@graveshift/shared/config';
import { AppScreen } from '../../app/AppScreen.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Button } from '../components/Button.tsx';
import { Checkbox } from '../components/Checkbox.tsx';
import { SingleSelect } from '../components/SingleSelect.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { playerName } from '../../i18n/localeMessages.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { BotCountPicker } from './BotCountPicker.tsx';

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
  const shareCode = (): void => {
    void navigator.clipboard.writeText(room.code).catch(() => undefined);
  };
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
      <button type="button" class="room-code" onClick={shareCode} title={text.copyCode}>
        <span>{text.roomCode}</span>
        <strong>{room.code}</strong>
        <small>{text.copyHint(ROOM_RULES.maxPlayers)}</small>
      </button>
      <BotCountPicker
        humans={humans}
        bots={room.members.length - humans}
        editable={localId === room.hostId}
        onChange={(count) => {
          commands.setBotCount(count);
        }}
      />
      <div class="bot-picker">
        <span class="bot-picker__label">{text.waveCount}</span>
        <SingleSelect
          variant="radio"
          ariaLabel={text.waveCount}
          options={WAVE_COUNTS}
          value={room.settings.totalWaves}
          label={(count) => count}
          disabled={localId !== room.hostId || room.inMatch}
          onChange={(totalWaves) => {
            commands.setMatchSettings({ ...room.settings, totalWaves });
          }}
        />
      </div>
      <label class="bot-picker bot-picker--friendly-fire">
        <span class="bot-picker__label">{text.friendlyFire}</span>
        <Checkbox
          class="bot-picker__checkbox"
          checked={room.settings.friendlyFire}
          disabled={localId !== room.hostId || room.inMatch}
          onChange={(friendlyFire) => {
            commands.setMatchSettings({
              ...room.settings,
              friendlyFire,
            });
          }}
        />
      </label>
      <ul class="roster">
        {room.members.map((member) => {
          const hero = HERO_CONTENT[member.hero];
          const heroTexts = messages.heroes[member.hero];
          return (
            <li key={member.clientId} class="roster__row" style={{ '--hero-color': hero.color }}>
              <span class="roster__dot" />
              <div class="roster__who">
                <strong>
                  {member.isBot ? '🤖 ' : ''}
                  {playerName(member.clientId, member.nickname, messages)}
                  {member.clientId === room.hostId ? ' 👑' : ''}
                  {member.clientId === localId ? text.you : ''}
                </strong>
                <small>
                  {heroTexts.name} · {heroTexts.title}
                </small>
              </div>
              {member.isBot ? (
                <span class="badge">{text.bot}</span>
              ) : (
                <span class={member.ready ? 'badge badge--ok' : 'badge'}>
                  {member.ready ? text.readyBadge : text.waitingBadge}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </ScreenFrame>
  );
}
