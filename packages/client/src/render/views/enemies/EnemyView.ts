import { Group } from 'three';
import { exponentialDecayFactor, lerpAngle } from '@graveshift/shared/core';
import { EnemyAction } from '@graveshift/shared/model';
import type { EnemyFrame } from '../../../game/view/WorldFrame.ts';
import { AnimationName } from '../../characters/clipTools.ts';
import type { CharacterRig } from '../../characters/CharacterRig.ts';
import { placeOnGround, yawFromAngle } from '../../space.ts';
import type { EntityView } from '../EntityView.ts';
import type { HealthBar } from '../HealthBar.ts';
import type { EnemyBearing } from './EnemyBearing.ts';
import type { EnemyViewParts } from './EnemyViewParts.ts';

const DEATH_LINGER_SECONDS = 1.4;
const SINK_SPEED = 0.6;
const TURN_SHARPNESS = 14;

export class EnemyView implements EntityView<EnemyFrame> {
  readonly object = new Group();
  private readonly lift = new Group();
  private readonly rig: CharacterRig;
  private readonly healthBar: HealthBar;
  private readonly bearing: EnemyBearing;
  private readonly walkTimeScale: number;
  private yaw: number;
  private retiredSeconds = 0;

  constructor(frame: EnemyFrame, parts: EnemyViewParts) {
    this.rig = parts.rig;
    this.healthBar = parts.healthBar;
    this.bearing = parts.bearing;
    this.walkTimeScale = parts.walkTimeScale;
    this.lift.add(this.rig.root, this.healthBar.object);
    this.object.add(this.lift);
    this.bearing.attach(this.object, this.lift);
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
    const attacking = frame.action === EnemyAction.Attacking;
    this.bearing.update(attacking, deltaSeconds);
    if (attacking) {
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
    this.bearing.fall(deltaSeconds);
    if (this.retiredSeconds > DEATH_LINGER_SECONDS * 0.6) {
      this.object.position.y -= SINK_SPEED * deltaSeconds;
    }
    this.rig.update(deltaSeconds);
    return this.retiredSeconds < DEATH_LINGER_SECONDS;
  }

  dispose(): void {
    this.rig.dispose();
    this.healthBar.dispose();
    this.bearing.dispose();
    this.object.removeFromParent();
  }
}
