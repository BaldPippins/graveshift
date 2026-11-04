import { TrapKind } from '@graveshift/shared/config';
import { ModelKey } from '../assets/ModelKey.ts';
import { PALETTE } from './palette.ts';

export interface TrapContent {
  readonly armedModel: ModelKey;
  readonly sprungModel: ModelKey;
  readonly markColor: number;
  readonly fuseHeight: number | null;
}

export const TRAP_CONTENT: Readonly<Record<TrapKind, TrapContent>> = {
  [TrapKind.PowderKeg]: {
    armedModel: ModelKey.PowderKeg,
    sprungModel: ModelKey.PowderKeg,
    markColor: PALETTE.kegMark,
    fuseHeight: 0.82,
  },
  [TrapKind.BearTrap]: {
    armedModel: ModelKey.BearTrapOpen,
    sprungModel: ModelKey.BearTrapClosed,
    markColor: PALETTE.bearTrapMark,
    fuseHeight: null,
  },
};
