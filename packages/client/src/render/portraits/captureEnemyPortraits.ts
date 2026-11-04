import { ENEMY_KINDS } from '@graveshift/shared/config';
import type { EnemyKind } from '@graveshift/shared/config';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { ENEMY_CONTENT } from '../../content/enemyContent.ts';
import { AnimationName } from '../characters/clipTools.ts';
import { createCharacterRig } from '../characters/createCharacterRig.ts';
import { PortraitStudio } from './PortraitStudio.ts';

const POSE_SECONDS = 0.25;

export function captureEnemyPortraits(assets: AssetLibrary): ReadonlyMap<EnemyKind, string> {
  const studio = new PortraitStudio();
  const portraits = new Map<EnemyKind, string>();
  try {
    for (const kind of ENEMY_KINDS) {
      const content = ENEMY_CONTENT[kind];
      const rig = createCharacterRig(assets, content.model, content.opacity);
      rig.playBase(content.flight === null ? AnimationName.Idle : AnimationName.AttackMelee);
      rig.update(POSE_SECONDS);
      portraits.set(kind, studio.shoot(rig.root));
      rig.dispose();
    }
  } finally {
    studio.dispose();
  }
  return portraits;
}
