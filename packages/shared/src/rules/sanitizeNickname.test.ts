import { describe, expect, it } from 'vitest';
import { sanitizeNickname } from './sanitizeNickname.ts';

describe('sanitizeNickname', () => {
  it('trims, collapses whitespace and strips control characters', () => {
    expect(sanitizeNickname('  Лысый \u0007  Пиппин ')).toBe('Лысый Пиппин');
  });

  it('enforces length limits by grapheme', () => {
    expect(sanitizeNickname('a')).toBeNull();
    expect(sanitizeNickname('x'.repeat(17))).toBeNull();
    expect(sanitizeNickname('👨‍👩‍👧👨‍👩‍👧')).toBe('👨‍👩‍👧👨‍👩‍👧');
  });
});
