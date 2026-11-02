import { PickupKind } from '@graveshift/shared/config';
import { ModelKey } from '../assets/ModelKey.ts';

export interface PickupContent {
  readonly model: ModelKey;
  readonly sparkleColor: number;
}

export const PICKUP_CONTENT: Readonly<Record<PickupKind, PickupContent>> = {
  [PickupKind.Coins]: { model: ModelKey.Coin, sparkleColor: 0xffd34d },
  [PickupKind.Heart]: { model: ModelKey.Potion, sparkleColor: 0xff5a7a },
  [PickupKind.Pumpkin]: { model: ModelKey.Pumpkin, sparkleColor: 0xff8a2a },
};
