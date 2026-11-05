import type { JSX } from 'preact';
import type { RoomStateMessage } from '@graveshift/shared/protocol';
import { isLevelHeroAllowed } from '@graveshift/shared/rules';
import type { LevelTeam } from '@graveshift/shared/world';
import { HERO_CONTENT } from '../../../content/heroContent.ts';
import { PALETTE } from '../../../content/palette.ts';
import { cssColor } from '../../../content/cssColor.ts';
import { playerName } from '../../../i18n/localeMessages.ts';
import { useMessages } from '../../useMessages.ts';

export interface LobbyRosterProps {
  readonly room: RoomStateMessage;
  readonly localId: number | null;
  readonly team: LevelTeam;
}

export function LobbyRoster(props: LobbyRosterProps): JSX.Element {
  const messages = useMessages();
  const text = messages.lobby;
  return (
    <ul class="roster">
      {props.room.members.map((member) => {
        const hero = HERO_CONTENT[member.hero];
        const heroTexts = messages.heroes[member.hero];
        return (
          <li key={member.clientId} class="roster__row" style={{ '--hero-color': hero.color }}>
            <span class="roster__dot" />
            <div class="roster__who">
              <strong>
                {member.isBot ? '🤖 ' : ''}
                {playerName(member.clientId, member.nickname, messages)}
                {member.clientId === props.room.hostId ? ' 👑' : ''}
                {member.clientId === props.localId ? text.you : ''}
              </strong>
              <small>
                {heroTexts.name} · {heroTexts.title}
              </small>
              {isLevelHeroAllowed(props.team, member.hero) ? null : (
                <small style={{ color: cssColor(PALETTE.crosshairDot) }}>
                  {text.incompatibleHero}
                </small>
              )}
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
  );
}
