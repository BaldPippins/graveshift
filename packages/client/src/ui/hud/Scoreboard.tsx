import type { JSX } from 'preact';
import type { TeammateHud } from '../../app/state/HudState.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { useMessages } from '../useMessages.ts';

export interface ScoreboardProps {
  readonly teammates: readonly TeammateHud[];
}

export function Scoreboard(props: ScoreboardProps): JSX.Element {
  const messages = useMessages();
  const text = messages.scoreboard;
  return (
    <div class="overlay overlay--transparent">
      <div class="panel scoreboard">
        <h1 class="panel__title">{text.title}</h1>
        <table class="stats-table">
          <thead>
            <tr>
              <th>{text.player}</th>
              <th>{text.hero}</th>
              <th>{text.health}</th>
              <th>{text.coins}</th>
            </tr>
          </thead>
          <tbody>
            {props.teammates.map((teammate) => (
              <tr key={teammate.id} class={teammate.isLocal ? 'is-local' : ''}>
                <td>{teammate.nickname}</td>
                <td style={{ color: HERO_CONTENT[teammate.hero].color }}>
                  {messages.heroes[teammate.hero].name}
                </td>
                <td>{Math.round(teammate.healthFraction * 100)}%</td>
                <td>{teammate.coins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
