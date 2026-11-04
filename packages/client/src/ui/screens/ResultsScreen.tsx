import type { JSX } from 'preact';
import { MatchOutcome } from '@graveshift/shared/model';
import { matchScore } from '@graveshift/shared/rules';
import { ACHIEVEMENT_ICONS } from '../../content/achievementContent.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Button } from '../components/Button.tsx';
import { RankingTable } from '../components/RankingTable.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { formatDuration, formatNumber, formatPercent } from '../format.ts';
import { playerName } from '../../i18n/localeMessages.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function ResultsScreen(): JSX.Element {
  const { ui, commands } = useServices();
  const messages = useMessages();
  const text = messages.results;
  const result = ui.matchResult.value;
  if (result === null) {
    return <ScreenFrame title={text.title}>{null}</ScreenFrame>;
  }
  const victory = result.outcome === MatchOutcome.Victory;
  return (
    <ScreenFrame
      title={victory ? text.victory : text.defeat}
      subtitle={text.subtitle(
        result.wave,
        result.totalWaves,
        formatDuration(result.durationSeconds),
      )}
      side="left"
      footer={
        <Button
          variant="primary"
          onClick={() => {
            commands.continueFromResults();
          }}
        >
          {messages.common.continue}
        </Button>
      }
    >
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
        players={result.stats.map((stats) => ({
          id: stats.playerId,
          name: playerName(stats.playerId, stats.nickname, messages),
          nameColor: HERO_CONTENT[stats.hero].color,
          score: matchScore(stats),
          isLocal: stats.playerId === result.localPlayerId,
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
      {result.unlockedAchievements.length === 0 ? null : (
        <div class="unlocked">
          <h2>{text.newAchievements}</h2>
          <div class="unlocked__list">
            {result.unlockedAchievements.map((id) => (
              <span key={id} class="badge badge--gold">
                {ACHIEVEMENT_ICONS[id]} {messages.achievementTexts[id].title}
              </span>
            ))}
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}
