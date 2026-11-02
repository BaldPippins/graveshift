import { ROOM_RULES } from '../config/simulation.ts';

const CONTROL_CHARACTERS = /\p{Cc}/gu;
const REPEATED_WHITESPACE = /\s+/gu;
const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

export function sanitizeNickname(raw: string): string | null {
  const cleaned = raw.replace(CONTROL_CHARACTERS, '').replace(REPEATED_WHITESPACE, ' ').trim();
  const length = Array.from(graphemes.segment(cleaned)).length;
  if (length < ROOM_RULES.minNicknameLength || length > ROOM_RULES.maxNicknameLength) {
    return null;
  }
  return cleaned;
}
