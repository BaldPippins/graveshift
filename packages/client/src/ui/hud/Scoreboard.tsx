import type { JSX } from 'preact';
import type { TeammateHud } from '../../app/state/HudState.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { PALETTE } from '../../content/palette.ts';
import { useMessages } from '../useMessages.ts';

const PODIUM_COLORS = [PALETTE.trophyGold, PALETTE.trophySilver, PALETTE.trophyBronze];

function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export interface ScoreboardProps {
  readonly teammates: readonly TeammateHud[];
}

export function Scoreboard(props: ScoreboardProps): JSX.Element {
  const messages = useMessages();
  const text = messages.scoreboard;
  const ranked = [...props.teammates]
    .sort((left, right) => right.score - left.score)
    .map((teammate, _index, players) => {
      const place = players.findIndex((player) => player.score === teammate.score) + 1;
      return { teammate, place, isPodium: teammate.score > 0 && place <= PODIUM_COLORS.length };
    });
  return (
    <div class="overlay overlay--transparent">
      <div class="panel scoreboard">
        <h1 class="panel__title">{text.title}</h1>
        <div class="table-scroll">
          <table class="stats-table">
            <thead>
              <tr>
                <th>{text.player}</th>
                <th>{text.score}</th>
                <th>{text.kdr}</th>
                <th>{text.hero}</th>
                <th>{text.health}</th>
                <th>{text.coins}</th>
                <th>{text.ping}</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ teammate, place, isPodium }) => (
                <tr key={teammate.id} class={teammate.isLocal ? 'is-local' : ''}>
                  <td>
                    <span class="scoreboard__player">
                      <span
                        class={isPodium ? 'scoreboard__rank is-podium' : 'scoreboard__rank'}
                        style={{
                          color: isPodium
                            ? cssColor(PODIUM_COLORS[place - 1] ?? PALETTE.trophyGold)
                            : undefined,
                        }}
                      >
                        {isPodium ? (
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d={
                                'M7 3h10v2h4v2c0 3-2 5-5 5h-.1A5 5 0 0 1 13 15.9V19h4v2H7v-2h4' +
                                'v-3.1A5 5 0 0 1 8.1 12H8c-3 0-5-2-5-5V5h4V3Zm0 4H5' +
                                'c0 1.7.8 2.7 2.2 2.9A15 15 0 0 1 7 7Zm10 0c0 1-.1 2-.2 2.9' +
                                'C18.2 9.7 19 8.7 19 7h-2Z'
                              }
                            />
                          </svg>
                        ) : null}
                        <span
                          style={{ color: isPodium ? cssColor(PALETTE.trophyNumber) : undefined }}
                        >
                          {place}
                        </span>
                      </span>
                      {teammate.nickname}
                    </span>
                  </td>
                  <td>{teammate.score}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
