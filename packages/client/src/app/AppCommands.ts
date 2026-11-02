import type { HeroId, WeaponId } from '@graveshift/shared/config';
import type { ShopOffer } from '@graveshift/shared/rules';
import type { Settings } from '../meta/settings/Settings.ts';
import type { AppScreen } from './AppScreen.ts';

export interface AppCommands {
  navigate(screen: AppScreen): void;
  createRoom(): Promise<void>;
  joinRoom(code: string): Promise<void>;
  leaveRoom(): void;
  previewHero(hero: HeroId): void;
  confirmHero(hero: HeroId): void;
  setReady(ready: boolean): void;
  setBotCount(count: number): void;
  purchase(offer: ShopOffer): void;
  selectWeapon(weapon: WeaponId): void;
  cycleWeapon(direction: number): void;
  reload(): void;
  setPaused(paused: boolean): void;
  setShopVisible(visible: boolean): void;
  voteSkipIntermission(): void;
  leaveMatch(): void;
  continueFromResults(): void;
  updateSettings(patch: Partial<Settings>): void;
  resetProgress(): void;
  dismissToast(id: number): void;
  toggleFullscreen(): void;
}
