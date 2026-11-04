import type { SoundId } from './SoundId.ts';
import type { SoundPlacement } from './SoundPlacement.ts';

export interface SoundPlayer {
  play(id: SoundId, placement?: SoundPlacement): void;
}
