import type { JSX } from 'preact';
import type { TeammateHud } from '../../app/state/HudState.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { RankingTable } from '../components/RankingTable.tsx';
import { useMessages } from '../useMessages.ts';

export interface ScoreboardProps {
  readonly teammates: readonly TeammateHud[];
}

export function Scoreboard(props: ScoreboardProps): JSX.Element {
  const messages = useMessages();
  const text = messages.scoreboard;
  return (
    <div class="overlay overlay--transparent">
      <div class="panel scoreboard" data-game-input>
        <h1 class="panel__title">{text.title}</h1>
        <RankingTable
          headers={[text.kdr, text.hero, text.health, text.coins, text.ping]}
          players={props.teammates.map((teammate) => ({
            id: teammate.id,
            name: teammate.nickname,
            nameColor: undefined,
            score: teammate.score,
            isLocal: teammate.isLocal,
            cells: (
              <>
                <td>
                  {teammate.kills} / {teammate.deaths} / {teammate.revives}
                </td>
                <td style={{ color: HERO_CONTENT[teammate.hero].color }}>
                  {messages.heroes[teammate.hero].name}
                </td>
                <td>{Math.round(teammate.healthFraction * 100)}%</td>
                <td>{teammate.coins}</td>
                <td>
                  {teammate.pingMilliseconds === null
                    ? '—'
                    : messages.hud.ping(teammate.pingMilliseconds)}
                </td>
              </>
            ),
          }))}
        />
      </div>
    </div>
  );
}
