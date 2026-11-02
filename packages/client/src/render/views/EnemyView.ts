import { Group } from 'three';
import { ENEMIES } from '@graveshift/shared/config';
import { exponentialDecayFactor, lerpAngle } from '@graveshift/shared/core';
import { EnemyAction } from '@graveshift/shared/model';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { ENEMY_CONTENT } from '../../content/enemyContent.ts';
import type { EnemyFrame } from '../../game/view/WorldFrame.ts';
import { AnimationName } from '../characters/clipTools.ts';
import type { CharacterRig } from '../characters/CharacterRig.ts';
import { createCharacterRig } from '../characters/createCharacterRig.ts';
import { placeOnGround, yawFromAngle } from '../space.ts';
import type { EntityView } from './EntityView.ts';
import { HealthBar } from './HealthBar.ts';
import { ENEMY_HEALTH_BAR } from './HealthBarStyle.ts';

const DEATH_LINGER_SECONDS = 1.4;
const SINK_SPEED = 0.6;
const TURN_SHARPNESS = 14;
const WALK_REFERENCE_SPEED = 2;

export class EnemyView implements EntityView<EnemyFrame> {
  readonly object = new Group();
  private readonly rig: CharacterRig;
  private readonly healthBar: HealthBar;
  private readonly walkTimeScale: number;
  private yaw: number;
  private retiredSeconds = 0;

  constructor(frame: EnemyFrame, assets: AssetLibrary) {
    const content = ENEMY_CONTENT[frame.kind];
    this.rig = createCharacterRig(assets, content.model, content.opacity);
    const definition = ENEMIES[frame.kind];
    this.walkTimeScale = definition.moveSpeed / WALK_REFERENCE_SPEED;
    this.healthBar = new HealthBar(definition.radius * 3.4, ENEMY_HEALTH_BAR);
    this.object.add(this.rig.root, this.healthBar.object);
    this.yaw = yawFromAngle(frame.facing);
  }

  flash(): void {
    this.rig.flash();
  }

  sync(frame: EnemyFrame, deltaSeconds: number): void {
    placeOnGround(this.object, frame.x, frame.y);
    this.yaw = lerpAngle(
      this.yaw,
      yawFromAngle(frame.facing),
      exponentialDecayFactor(TURN_SHARPNESS, deltaSeconds),
    );
    this.rig.root.rotation.y = this.yaw;
    this.healthBar.setFraction(frame.healthFraction);
    if (frame.action === EnemyAction.Attacking) {
      this.rig.playBase(AnimationName.AttackMelee);
    } else {
      this.rig.playBase(frame.moving ? AnimationName.Walk : AnimationName.Idle, {
        timeScale: this.walkTimeScale,
      });
    }
    this.rig.update(deltaSeconds);
  }

  retire(): void {
    this.healthBar.object.visible = false;
    this.rig.playBase(AnimationName.Die, { once: true });
  }

  updateRetired(deltaSeconds: number): boolean {
    this.retiredSeconds += deltaSeconds;
    if (this.retiredSeconds > DEATH_LINGER_SECONDS * 0.6) {
      this.object.position.y -= SINK_SPEED * deltaSeconds;
    }
    this.rig.update(deltaSeconds);
    return this.retiredSeconds < DEATH_LINGER_SECONDS;
  }

  dispose(): void {
    this.rig.dispose();
    this.healthBar.dispose();
    this.object.removeFromParent();
  }
}
