import type { ValueOf } from '@graveshift/shared/core';

export const KeyBinding = {
  Reload: 'KeyR',
  CycleWeapon: 'KeyQ',
  Pause: 'Escape',
  PauseAlternate: 'KeyP',
  Shop: 'KeyB',
  Scoreboard: 'Tab',
  Jump: 'Space',
} as const;
export type KeyBinding = ValueOf<typeof KeyBinding>;

export const WEAPON_SLOT_KEYS: readonly string[] = [
  'Digit1',
  'Digit2',
  'Digit3',
  'Digit4',
  'Digit5',
];

const KEY_LABEL_OVERRIDES: Readonly<Record<string, string>> = { Escape: 'Esc' };

export function keyLabel(code: string): string {
  return KEY_LABEL_OVERRIDES[code] ?? code.replace(/^(Key|Digit)/, '');
}
