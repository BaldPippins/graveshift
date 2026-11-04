import type { TracerLook } from '../../../content/tracerContent.ts';
import type { TracerMotion } from './TracerMotion.ts';

export interface TracerKind {
  readonly look: TracerLook;
  readonly motion: TracerMotion;
}
