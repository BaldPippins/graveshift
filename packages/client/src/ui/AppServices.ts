import type { ReadonlySignal } from '@preact/signals-core';
import type { AppCommands } from '../app/AppCommands.ts';
import type { UiState } from '../app/state/UiState.ts';
import type { Messages } from '../i18n/Messages.ts';
import type { ProgressionService } from '../meta/ProgressionService.ts';
import type { SettingsStore } from '../meta/settings/SettingsStore.ts';

export interface AppServices {
  readonly ui: UiState;
  readonly commands: AppCommands;
  readonly settings: SettingsStore;
  readonly progression: ProgressionService;
  readonly messages: ReadonlySignal<Messages>;
}
