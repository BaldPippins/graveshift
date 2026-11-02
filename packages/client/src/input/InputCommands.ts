export interface InputCommands {
  selectWeaponSlot(slot: number): void;
  cycleWeapon(direction: number): void;
  togglePause(): void;
  toggleShop(): void;
  setScoreboardVisible(visible: boolean): void;
}
