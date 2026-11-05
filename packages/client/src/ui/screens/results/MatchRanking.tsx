import type { JSX } from 'preact';
import { matchScore } from '@graveshift/shared/rules';
import type { MatchResult } from '../../../app/state/MatchResult.ts';
import { HERO_CONTENT } from '../../../content/heroContent.ts';
import { playerName } from '../../../i18n/localeMessages.ts';
import { RankingTable } from '../../components/RankingTable.tsx';
import { formatNumber, formatPercent } from '../../format.ts';
import { useMessages } from '../../useMessages.ts';

export interface MatchRankingProps {
  readonly result: MatchResult;
}

export function MatchRanking(props: MatchRankingProps): JSX.Element {
  const messages = useMessages();
  const text = messages.results;
  return (
    <RankingTable
      headers={[
        text.kills,
        text.bossKills,
        text.damage,
        text.accuracy,
        text.revives,
        text.downs,
        text.deaths,
        text.coins,
      ]}
      players={props.result.stats.map((stats) => ({
        id: stats.playerId,
        name: playerName(stats.playerId, stats.nickname, messages),
        nameColor: HERO_CONTENT[stats.hero].color,
        score: matchScore(stats),
        isLocal: stats.playerId === props.result.localPlayerId,
        cells: (
          <>
            <td>{stats.kills}</td>
            <td>{stats.bossKills}</td>
            <td>{formatNumber(stats.damageDealt, messages)}</td>
            <td>{formatPercent(stats.shotsHit, stats.shotsFired)}</td>
            <td>{stats.revives}</td>
            <td>{stats.downs}</td>
            <td>{stats.deaths}</td>
            <td>{formatNumber(stats.coinsEarned, messages)}</td>
          </>
        ),
      }))}
    />
  );
}
