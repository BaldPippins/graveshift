import { describe, expect, it } from 'vitest';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import { AdminSettingsStore } from './AdminSettingsStore.ts';
import { LevelAvailability } from '../../application/admin/LevelAvailability.ts';

describe('level availability', () => {
  it('can recover when the only locally installed level is disabled in shared settings', () => {
    const settings = new AdminSettingsStore(':memory:');
    expect(settings.setLevelEnabled('graveyard', false, ['graveyard', 'arena'])).toBe(true);
    const availability = new LevelAvailability(new Map([['graveyard', GRAVEYARD_LEVEL]]), settings);
    expect(availability.enabled.size).toBe(0);
    expect(availability.set('graveyard', true)).toBe(true);
    expect(availability.enabled.has('graveyard')).toBe(true);
    settings.close();
  });
});
