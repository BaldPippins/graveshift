export interface StickState {
  readonly active: boolean;
  readonly originX: number;
  readonly originY: number;
  readonly knobX: number;
  readonly knobY: number;
}

export const INACTIVE_STICK: StickState = {
  active: false,
  originX: 0,
  originY: 0,
  knobX: 0,
  knobY: 0,
};
