import { ROOM_RULES } from '@graveshift/shared/config';
import { EN_MESSAGES } from './locales/en.ts';
import { Locale, LOCALES } from './Locale.ts';
import type { Messages } from './Messages.ts';
import { RU_MESSAGES } from './locales/ru.ts';

export const LOCALE_MESSAGES: Readonly<Record<Locale, Messages>> = {
  [Locale.Russian]: RU_MESSAGES,
  [Locale.English]: EN_MESSAGES,
};

export function detectLocale(preferred: readonly string[]): Locale {
  for (const language of preferred) {
    const match = LOCALES.find((locale) => language.toLowerCase().startsWith(locale));
    if (match !== undefined) {
      return match;
    }
  }
  return Locale.English;
}

export function playerName(playerId: number, serverNickname: string, messages: Messages): string {
  const botIndex = playerId - ROOM_RULES.firstBotPlayerId;
  return botIndex >= 0 ? (messages.lobby.botNames[botIndex] ?? serverNickname) : serverNickname;
}
