import type { Messages } from '../i18n/Messages.ts';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = Math.floor(totalSeconds % SECONDS_PER_MINUTE);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatPlayTime(totalSeconds: number, messages: Messages): string {
  const totalMinutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  return messages.stats.playTime(
    Math.floor(totalMinutes / MINUTES_PER_HOUR),
    totalMinutes % MINUTES_PER_HOUR,
    Math.floor(totalSeconds % SECONDS_PER_MINUTE),
  );
}

export function formatPercent(part: number, whole: number): string {
  return whole <= 0 ? '—' : `${Math.round((part / whole) * 100)}%`;
}

export function formatNumber(value: number, messages: Messages): string {
  return Math.round(value).toLocaleString(messages.numberLocale);
}
