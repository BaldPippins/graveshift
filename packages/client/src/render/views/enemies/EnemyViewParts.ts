import type { CharacterRig } from '../../characters/CharacterRig.ts';
import type { HealthBar } from '../HealthBar.ts';
import type { EnemyBearing } from './EnemyBearing.ts';

export interface EnemyViewParts {
  readonly rig: CharacterRig;
  readonly healthBar: HealthBar;
  readonly bearing: EnemyBearing;
  readonly walkTimeScale: number;
}
