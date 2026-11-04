import { describe, expect, it } from 'vitest';
import { ENEMY_KINDS, EnemyKind } from '@graveshift/shared/config';
import { enemyModelKey } from '../assets/ModelKey.ts';
import { MODEL_MANIFEST } from '../assets/modelManifest.ts';
import { LOCALE_MESSAGES } from '../i18n/localeMessages.ts';
import { LOCALES } from '../i18n/Locale.ts';
import { COUNTER_IDS, killCounterOf } from '../meta/counters/CounterId.ts';
import { ENEMY_CONTENT } from './enemyContent.ts';

describe('enemy registry', () => {
  it('derives model, icon, kill counter and texts for every enemy kind', () => {
    for (const kind of ENEMY_KINDS) {
      expect(MODEL_MANIFEST[enemyModelKey(kind)]).toBe(ENEMY_CONTENT[kind].model);
      expect(ENEMY_CONTENT[kind].icon).not.toBe('');
      expect(COUNTER_IDS).toContain(killCounterOf(kind));
      for (const locale of LOCALES) {
        expect(LOCALE_MESSAGES[locale].enemies[kind].name).not.toBe('');
      }
    }
    expect(new Set(ENEMY_KINDS.map(killCounterOf)).size).toBe(ENEMY_KINDS.length);
  });

  it('keeps the stored kill counter keys players already have', () => {
    expect(killCounterOf(EnemyKind.Zombie)).toBe('kills.zombie');
    expect(killCounterOf(EnemyKind.Skeleton)).toBe('kills.skeleton');
    expect(killCounterOf(EnemyKind.Ghost)).toBe('kills.ghost');
    expect(killCounterOf(EnemyKind.Brute)).toBe('kills.brute');
    expect(killCounterOf(EnemyKind.Vampire)).toBe('kills.vampire');
  });
});
