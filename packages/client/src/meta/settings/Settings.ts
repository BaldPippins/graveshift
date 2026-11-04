import type { ValueOf } from '@graveshift/shared/core';
import type { HeroId } from '@graveshift/shared/config';
import type { Locale } from '../../i18n/Locale.ts';

export const GraphicsQuality = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
} as const;
export type GraphicsQuality = ValueOf<typeof GraphicsQuality>;
export const GRAPHICS_QUALITIES: readonly GraphicsQuality[] = Object.values(GraphicsQuality);

export const TouchControlsMode = {
  Auto: 'auto',
  Always: 'always',
  Never: 'never',
} as const;
export type TouchControlsMode = ValueOf<typeof TouchControlsMode>;
export const TOUCH_CONTROLS_MODES: readonly TouchControlsMode[] = Object.values(TouchControlsMode);

export interface Settings {
  readonly nickname: string;
  readonly preferredHero: HeroId;
  readonly quality: GraphicsQuality;
  readonly showFps: boolean;
  readonly touchControls: TouchControlsMode;
  readonly screenShake: boolean;
  readonly cameraAimLead: boolean;
  readonly locale: Locale;
  readonly soundMuted: boolean;
  readonly soundVolume: number;
}
