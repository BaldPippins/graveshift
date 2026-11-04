import type { JSX } from 'preact';
import { ENEMY_KINDS } from '@graveshift/shared/config';
import { AppScreen } from '../../app/AppScreen.ts';
import type { Messages } from '../../i18n/Messages.ts';
import { CounterId } from '../../meta/counters/CounterId.ts';
import { KILL_COUNTERS } from '../../meta/counters/counterRules.ts';
import type { CounterValues } from '../../meta/counters/CounterStore.ts';
import { ENEMY_ICONS } from '../../content/enemyContent.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { formatNumber, formatPercent, formatPlayTime } from '../format.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

interface StatTile {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
}

function tilesOf(counters: CounterValues, messages: Messages): StatTile[] {
  const labels = messages.stats.labels;
  const count = (counter: CounterId): string => formatNumber(counters[counter], messages);
  return [
    { icon: '🕯️', label: labels.matchesPlayed, value: count(CounterId.MatchesPlayed) },
    { icon: '🌅', label: labels.wins, value: count(CounterId.Wins) },
    { icon: '🌊', label: labels.bestWave, value: count(CounterId.BestWave) },
    {
      icon: '⏱️',
      label: labels.timePlayed,
      value: formatPlayTime(counters[CounterId.SecondsPlayed], messages),
    },
    { icon: '💀', label: labels.kills, value: count(CounterId.Kills) },
    ...ENEMY_KINDS.map((kind) => ({
      icon: ENEMY_ICONS[kind],
      label: messages.enemies[kind].name,
      value: count(KILL_COUNTERS[kind]),
    })),
    {
      icon: '🎯',
      label: labels.accuracy,
      value: formatPercent(counters[CounterId.ShotsHit], counters[CounterId.ShotsFired]),
    },
    { icon: '💥', label: labels.damageDealt, value: count(CounterId.DamageDealt) },
    { icon: '🤝', label: labels.revives, value: count(CounterId.Revives) },
    { icon: '🩹', label: labels.downs, value: count(CounterId.Downs) },
    { icon: '🌪️', label: labels.bestMultikill, value: count(CounterId.BestMultikill) },
    { icon: '💰', label: labels.coinsEarned, value: count(CounterId.CoinsEarned) },
    { icon: '🛒', label: labels.coinsSpent, value: count(CounterId.CoinsSpent) },
    { icon: '❤️', label: labels.healsCollected, value: count(CounterId.HealsCollected) },
    { icon: '🗡️', label: labels.meleeKills, value: count(CounterId.MeleeKills) },
    { icon: '🔥', label: labels.furies, value: count(CounterId.Furies) },
  ];
}

export function StatsScreen(): JSX.Element {
  const { commands, progression } = useServices();
  const messages = useMessages();
  return (
    <ScreenFrame
      title={messages.stats.title}
      subtitle={messages.stats.subtitle}
      onBack={() => {
        commands.navigate(AppScreen.MainMenu);
      }}
    >
      <div class="stat-grid">
        {tilesOf(progression.counters.values.value, messages).map((tile) => (
          <div key={tile.label} class="stat-tile">
            <span class="stat-tile__icon">{tile.icon}</span>
            <strong>{tile.value}</strong>
            <small>{tile.label}</small>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}
