import { Group } from 'three';
import type { Scene } from 'three';
import type { PickupKind } from '@graveshift/shared/config';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent, MeleeSwungEvent } from '@graveshift/shared/protocol';
import { FURY_COLOR, WEAPON_CONTENT } from '../../content/weaponContent.ts';
import { ParticleBursts } from './ParticleBursts.ts';
import { SlashTrails } from './SlashTrails.ts';
import { TracerPool } from './TracerPool.ts';
import { PICKUP_CONTENT } from '../../content/pickupContent.ts';

const BLOOD = 0x9cff6b;
const ECTOPLASM = 0x8af3ff;
const SPARK = 0xfff2b0;
const CRIT_COLOR = 0xff3b3b;
const SPLASH_POINTS = 7;
const SPLASH_HEIGHT = 0.5;

export class EffectsLayer {
  private readonly root = new Group();
  private readonly tracers: TracerPool;
  private readonly particles: ParticleBursts;
  private readonly slashes: SlashTrails;

  constructor(scene: Scene) {
    scene.add(this.root);
    this.tracers = new TracerPool(this.root);
    this.particles = new ParticleBursts(this.root);
    this.slashes = new SlashTrails(this.root);
  }

  handle(event: GameEvent): void {
    switch (event.type) {
      case GameEventType.ShotFired:
        this.tracers.spawn(
          event.fromX,
          event.fromY,
          event.toX,
          event.toY,
          WEAPON_CONTENT[event.weapon].color,
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
      case GameEventType.MeleeSwung:
        this.meleeSwing(event);
        return;
      default:
        return;
    }
  }

  furyBurst(x: number, y: number): void {
    this.particles.burst(x, y, 0.6, FURY_COLOR, 40, 3.2);
    this.slashes.shockwave({
      x,
      y,
      height: 0,
      aim: 0,
      reach: 2.2,
      arcRadians: Math.PI * 2,
      color: FURY_COLOR,
    });
  }

  pickupSparkle(x: number, y: number, kind: PickupKind): void {
    this.particles.burst(x, y, 0.6, PICKUP_CONTENT[kind].sparkleColor, 14, 1.8);
  }

  merchantFall(x: number, y: number): void {
    this.particles.burst(x, y, 0.8, ECTOPLASM, 40, 3.5);
  }

  update(deltaSeconds: number): void {
    this.slashes.update(deltaSeconds);
    this.tracers.update(deltaSeconds);
    this.particles.update(deltaSeconds);
  }

  private meleeSwing(event: MeleeSwungEvent): void {
    const color = event.furious ? FURY_COLOR : WEAPON_CONTENT[event.weapon].color;
    const spec = {
      x: event.x,
      y: event.y,
      height: 0,
      aim: event.aim,
      reach: event.reach,
      arcRadians: event.arcRadians,
      color,
    };
    this.slashes.slash(spec);
    if (event.furious) {
      this.slashes.shockwave(spec);
    }
    if (event.critical) {
      this.slashes.shockwave({ ...spec, color: CRIT_COLOR });
      this.particles.burst(event.x, event.y, SPLASH_HEIGHT, CRIT_COLOR, 24, 3.4);
    }
    const sparks = event.furious ? 5 : 3;
    const firstAngle = event.aim - event.arcRadians / 2;
    for (let point = 0; point < SPLASH_POINTS; point += 1) {
      const angle = firstAngle + (event.arcRadians * point) / (SPLASH_POINTS - 1);
      this.particles.burst(
        event.x + Math.cos(angle) * event.reach,
        event.y + Math.sin(angle) * event.reach,
        SPLASH_HEIGHT,
        color,
        sparks,
        1.6,
      );
    }
    if (event.hits > 0) {
      this.particles.burst(event.x, event.y, SPLASH_HEIGHT, BLOOD, 6 * event.hits, 3);
    }
  }
}
