import '@preact/signals';
import { computed, effect } from '@preact/signals-core';
import { render } from 'preact';
import { MapId, tileMapOf } from '@graveshift/shared/world';
import { AppController } from './app/AppController.ts';
import { ConnectionManager } from './app/ConnectionManager.ts';
import { FrameLoop } from './app/FrameLoop.ts';
import { Notifier } from './app/Notifier.ts';
import { UiState } from './app/state/UiState.ts';
import { AssetLibrary } from './assets/AssetLibrary.ts';
import { AudioEngine } from './audio/AudioEngine.ts';
import { GameAudio } from './audio/GameAudio.ts';
import { SOUND_CONTENT } from './content/soundContent.ts';
import { ClientEventBus } from './game/events/ClientEventBus.ts';
import { ProgressionService } from './meta/ProgressionService.ts';
import { SettingsStore } from './meta/settings/SettingsStore.ts';
import { BrowserKeyValueStore } from './meta/storage/BrowserKeyValueStore.ts';
import { defaultServerUrl, NetClient } from './net/NetClient.ts';
import { detectLocale, LOCALE_MESSAGES } from './i18n/localeMessages.ts';
import { GameRenderer } from './render/GameRenderer.ts';
import { captureEnemyPortraits } from './render/portraits/captureEnemyPortraits.ts';
import { WorldRenderer } from './render/WorldRenderer.ts';
import { App } from './ui/App.tsx';
import './styles.css';

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing #${id} element`);
  }
  return element;
}

const stage = requireElement('stage');
const storage = new BrowserKeyValueStore();
const ui = new UiState();
const bus = new ClientEventBus();
const net = new NetClient();
const settings = new SettingsStore(storage, detectLocale(navigator.languages));
const messages = computed(() => LOCALE_MESSAGES[settings.current.value.locale]);
effect(() => {
  document.documentElement.lang = messages.value.locale;
});
const audioEngine = new AudioEngine(SOUND_CONTENT);
audioEngine.attach(window);
effect(() => {
  const current = settings.current.value;
  audioEngine.setMix({ muted: current.soundMuted, volume: current.soundVolume });
});
const audio = new GameAudio(audioEngine, bus);
const progression = new ProgressionService(bus, storage, () => performance.now());
const assets = new AssetLibrary();
const renderer = new GameRenderer(stage);
const map = tileMapOf(MapId.Graveyard);

const controller = new AppController({
  ui,
  net,
  connection: new ConnectionManager(net, ui, defaultServerUrl()),
  bus,
  settings,
  progression,
  messages,
  notifier: new Notifier(ui),
  audio,
  captureEnemyPortraits: () => captureEnemyPortraits(assets),
  createWorld: () =>
    new WorldRenderer(renderer, assets, map, {
      merchant: () => messages.value.merchantSign,
      trap: () => messages.value.trapSign,
    }),
  gameSurface: stage,
});

render(
  <App services={{ ui, commands: controller, settings, progression, messages }} />,
  requireElement('ui'),
);

new FrameLoop((now, delta) => {
  controller.frame(now, delta);
}).start();

void controller.boot((onProgress) => assets.loadAll(onProgress));
