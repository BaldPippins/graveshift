import { describe, expect, it } from 'vitest';
import { MemoryKeyValueStore } from '../storage/MemoryKeyValueStore.ts';
import { SettingsStore } from './SettingsStore.ts';

describe('SettingsStore', () => {
  it('starts muted at 30% volume', () => {
    const settings = new SettingsStore(new MemoryKeyValueStore(), 'ru').current.value;
    expect(settings.soundMuted).toBe(true);
    expect(settings.soundVolume).toBe(0.3);
  });

  it('keeps the sound choice across reloads', () => {
    const storage = new MemoryKeyValueStore();
    new SettingsStore(storage, 'ru').update({ soundMuted: false, soundVolume: 0.35 });
    const reloaded = new SettingsStore(storage, 'ru').current.value;
    expect(reloaded.soundMuted).toBe(false);
    expect(reloaded.soundVolume).toBe(0.35);
  });

  it('clamps a corrupted volume', () => {
    const storage = new MemoryKeyValueStore();
    storage.write('graveshift.settings.v1', { soundVolume: 7 });
    expect(new SettingsStore(storage, 'ru').current.value.soundVolume).toBe(1);
  });
});
