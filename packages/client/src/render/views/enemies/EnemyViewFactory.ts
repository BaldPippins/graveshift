import { ENEMIES } from '@graveshift/shared/config';
import type { EnemyKind } from '@graveshift/shared/config';
import type { AssetLibrary } from '../../../assets/AssetLibrary.ts';
import { ENEMY_CONTENT } from '../../../content/enemyContent.ts';
import type { EnemyFrame } from '../../../game/view/WorldFrame.ts';
import { createCharacterRig } from '../../characters/createCharacterRig.ts';
import { HealthBar } from '../HealthBar.ts';
import { ENEMY_HEALTH_BAR } from '../HealthBarStyle.ts';
import type { ShadowSettings } from '../ShadowSettings.ts';
import { AirBearing } from './AirBearing.ts';
import type { EnemyBearing } from './EnemyBearing.ts';
import { EnemyView } from './EnemyView.ts';
import { GroundBearing } from './GroundBearing.ts';
import { GroundShadow } from './GroundShadow.ts';
import { enemyModelKey } from '../../../assets/ModelKey.ts';

const WALK_REFERENCE_SPEED = 2;
const HEALTH_BAR_HEIGHT_PER_RADIUS = 3.4;
const SHADOW_RADIUS_PER_RADIUS = 1.4;
const GROUNDED = new GroundBearing();

export class EnemyViewFactory {
  private readonly assets: AssetLibrary;
  private readonly shadows: ShadowSettings;

  constructor(assets: AssetLibrary, shadows: ShadowSettings) {
    this.assets = assets;
    this.shadows = shadows;
  }

  create(frame: EnemyFrame): EnemyView {
    const content = ENEMY_CONTENT[frame.kind];
    const definition = ENEMIES[frame.kind];
    return new EnemyView(frame, {
      rig: createCharacterRig(this.assets, enemyModelKey(frame.kind), content.opacity),
      healthBar: new HealthBar(definition.radius * HEALTH_BAR_HEIGHT_PER_RADIUS, ENEMY_HEALTH_BAR),
      bearing: this.bearingFor(frame.kind),
      walkTimeScale: definition.moveSpeed / WALK_REFERENCE_SPEED,
    });
  }

  private bearingFor(kind: EnemyKind): EnemyBearing {
    const flight = ENEMY_CONTENT[kind].flight;
    if (flight === null) {
      return GROUNDED;
    }
    const shadow = new GroundShadow(ENEMIES[kind].radius * SHADOW_RADIUS_PER_RADIUS);
    return new AirBearing(flight, shadow, this.shadows);
  }
}
