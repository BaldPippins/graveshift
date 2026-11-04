import type { JSX } from 'preact';
import { formatNumber } from '../format.ts';
import { RankBadge } from '../hud/RankBadge.tsx';
import { useMessages } from '../useMessages.ts';

export interface RankingPlayer {
  readonly id: number;
  readonly name: string;
  readonly nameColor: string | undefined;
  readonly score: number;
  readonly isLocal: boolean;
  readonly cells: JSX.Element;
}

interface RankingTableProps {
  readonly players: readonly RankingPlayer[];
  readonly headers: readonly string[];
}

export function RankingTable({ players, headers }: RankingTableProps): JSX.Element {
  const messages = useMessages();
  const ranked = [...players].sort((left, right) => right.score - left.score);

  return (
    <div class="table-scroll">
      <table class="stats-table">
        <thead>
          <tr>
            <th>{messages.results.player}</th>
            <th>{messages.results.score}</th>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ranked.map((player) => {
            const place = ranked.findIndex((other) => other.score === player.score) + 1;
            return (
              <tr key={player.id} class={player.isLocal ? 'is-local' : ''}>
                <td>
                  <span class="scoreboard__player">
                    <RankBadge place={place} score={player.score} />
                    <span style={{ color: player.nameColor }}>{player.name}</span>
                  </span>
                </td>
                <td>{formatNumber(player.score, messages)}</td>
                {player.cells}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
