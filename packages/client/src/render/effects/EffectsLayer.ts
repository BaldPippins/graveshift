import { Group } from 'three';
import type { Scene } from 'three';
import type { PickupKind } from '@graveshift/shared/config';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent } from '@graveshift/shared/protocol';
import { WEAPON_CONTENT } from '../../content/weaponContent.ts';
import { ParticleBursts } from './ParticleBursts.ts';
import { TracerPool } from './TracerPool.ts';
import { PICKUP_CONTENT } from '../../content/pickupContent.ts';

const BLOOD = 0x9cff6b;
const ECTOPLASM = 0x8af3ff;
const SPARK = 0xfff2b0;

export class EffectsLayer {
  private readonly root = new Group();
  private readonly tracers: TracerPool;
  private readonly particles: ParticleBursts;

  constructor(scene: Scene) {
    scene.add(this.root);
    this.tracers = new TracerPool(this.root);
    this.particles = new ParticleBursts(this.root);
  }

  handle(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.ShotFired:
        this.tracers.spawn(
          event.fromX,
          event.fromY,
          event.toX,
          event.toY,
          WEAPON_CONTENT[event.weapon].tracerColor,
        );
        if (!event.hit) {
          this.particles.burst(event.toX, event.toY, 0.5, SPARK, 3, 1.5);
        }
        return;
      case GameEventType.EnemyDamaged:
        this.particles.burst(event.x, event.y, 0.6, BLOOD, 5, 2);
        return;
      case GameEventType.EnemyKilled:
        this.particles.burst(event.x, event.y, 0.5, ECTOPLASM, 18, 2.8);
        return;
      default:
        return;
    }
  }

  pickupSparkle(x: number, y: number, kind: PickupKind): void {
    this.particles.burst(x, y, 0.6, PICKUP_CONTENT[kind].sparkleColor, 14, 1.8);
  }

  merchantFall(x: number, y: number): void {
    this.particles.burst(x, y, 0.8, ECTOPLASM, 40, 3.5);
  }

  update(deltaSeconds: number): void {
    this.tracers.update(deltaSeconds);
    this.particles.update(deltaSeconds);
  }
}
