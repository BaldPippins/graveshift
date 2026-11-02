import { HERO_IDS, HeroId } from '@graveshift/shared/config';
import { signal } from '@preact/signals-core';
import type { ReadonlySignal } from '@preact/signals-core';
import { isRecord, pickString } from '../storage/guards.ts';
import { LOCALES } from '../../i18n/Locale.ts';
import type { Locale } from '../../i18n/Locale.ts';
import type { KeyValueStore } from '../storage/KeyValueStore.ts';
import {
  GRAPHICS_QUALITIES,
  GraphicsQuality,
  TOUCH_CONTROLS_MODES,
  TouchControlsMode,
} from './Settings.ts';
import type { Settings } from './Settings.ts';

const STORAGE_KEY = 'graveshift.settings.v1';

function defaultSettings(locale: Locale): Settings {
  return {
    nickname: '',
    preferredHero: HeroId.Pippin,
    quality: GraphicsQuality.Medium,
    showFps: false,
    touchControls: TouchControlsMode.Auto,
    screenShake: true,
    locale,
  };
}

function parseSettings(raw: unknown, defaultLocale: Locale): Settings {
  const defaults = defaultSettings(defaultLocale);
  if (!isRecord(raw)) {
    return defaults;
  }
  const hero = HERO_IDS.find((id) => id === raw['preferredHero']) ?? defaults.preferredHero;
  return {
    nickname: typeof raw['nickname'] === 'string' ? raw['nickname'] : defaults.nickname,
    preferredHero: hero,
    quality: pickString(raw['quality'], GRAPHICS_QUALITIES, defaults.quality),
    showFps: typeof raw['showFps'] === 'boolean' ? raw['showFps'] : defaults.showFps,
    touchControls: pickString(raw['touchControls'], TOUCH_CONTROLS_MODES, defaults.touchControls),
    screenShake:
      typeof raw['screenShake'] === 'boolean' ? raw['screenShake'] : defaults.screenShake,
    locale: pickString(raw['locale'], LOCALES, defaults.locale),
  };
}

export class SettingsStore {
  private readonly storage: KeyValueStore;
  private readonly state;

  constructor(storage: KeyValueStore, defaultLocale: Locale) {
    this.storage = storage;
    this.state = signal<Settings>(parseSettings(storage.read(STORAGE_KEY), defaultLocale));
  }

  get current(): ReadonlySignal<Settings> {
    return this.state;
  }

  update(patch: Partial<Settings>): void {
    this.state.value = { ...this.state.value, ...patch };
    this.storage.write(STORAGE_KEY, this.state.value);
  }
}
