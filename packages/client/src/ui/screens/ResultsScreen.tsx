import type { JSX } from 'preact';
import { WAVE_RULES } from '@graveshift/shared/config';
import { MatchOutcome } from '@graveshift/shared/model';
import { matchScore } from '@graveshift/shared/rules';
import { ACHIEVEMENT_ICONS } from '../../content/achievementContent.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Button } from '../components/Button.tsx';
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
  const ranked = [...result.stats].sort((left, right) => matchScore(right) - matchScore(left));
  const mvp = ranked[0];
  return (
    <ScreenFrame
      title={victory ? text.victory : text.defeat}
      subtitle={text.subtitle(
        result.wave,
        WAVE_RULES.totalWaves,
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
      <div class="table-scroll">
        <table class="stats-table">
          <thead>
            <tr>
              <th>{text.player}</th>
              <th>{text.score}</th>
              <th>{text.kills}</th>
              <th>{text.bossKills}</th>
              <th>{text.damage}</th>
              <th>{text.accuracy}</th>
              <th>{text.revives}</th>
              <th>{text.downs}</th>
              <th>{text.deaths}</th>
              <th>{text.coins}</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((stats) => (
              <tr
                key={stats.playerId}
                class={stats.playerId === result.localPlayerId ? 'is-local' : ''}
              >
                <td style={{ color: HERO_CONTENT[stats.hero].color }}>
                  {stats === mvp ? '⭐ ' : ''}
                  {playerName(stats.playerId, stats.nickname, messages)}
                </td>
                <td>{formatNumber(matchScore(stats), messages)}</td>
                <td>{stats.kills}</td>
                <td>{stats.bossKills}</td>
                <td>{formatNumber(stats.damageDealt, messages)}</td>
                <td>{formatPercent(stats.shotsHit, stats.shotsFired)}</td>
                <td>{stats.revives}</td>
                <td>{stats.downs}</td>
                <td>{stats.deaths}</td>
                <td>{formatNumber(stats.coinsEarned, messages)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
