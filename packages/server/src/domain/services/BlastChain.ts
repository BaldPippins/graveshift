import type { PlayerEntity } from '../entities/PlayerEntity.ts';

export interface BlastChain {
  survivor: PlayerEntity | null;
}
