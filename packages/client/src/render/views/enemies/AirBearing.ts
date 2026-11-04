import { Group } from 'three';
import { exponentialDecayFactor } from '@graveshift/shared/core';
import type { FlightStyle } from '../../../content/enemyContent.ts';
import type { ShadowSettings } from '../ShadowSettings.ts';
import type { EnemyBearing } from './EnemyBearing.ts';
import type { GroundShadow } from './GroundShadow.ts';

const FALL_SHARPNESS = 5;

export class AirBearing implements EnemyBearing {
  private readonly flight: FlightStyle;
  private readonly shadow: GroundShadow;
  private readonly shadows: ShadowSettings;
  private lift = new Group();
  private altitude: number;

  constructor(flight: FlightStyle, shadow: GroundShadow, shadows: ShadowSettings) {
    this.flight = flight;
    this.shadow = shadow;
    this.shadows = shadows;
    this.altitude = flight.cruiseHeight;
  }

  attach(view: Group, lift: Group): void {
    this.lift = lift;
    view.add(this.shadow.object);
    this.settle(this.altitude, 1);
  }

  update(diving: boolean, deltaSeconds: number): void {
    const target = diving ? this.flight.diveHeight : this.flight.cruiseHeight;
    this.settle(target, exponentialDecayFactor(this.flight.climbSharpness, deltaSeconds));
  }

  fall(deltaSeconds: number): void {
    this.settle(0, exponentialDecayFactor(FALL_SHARPNESS, deltaSeconds));
  }

  dispose(): void {
    this.shadow.dispose();
  }

  private settle(target: number, blend: number): void {
    this.altitude += (target - this.altitude) * blend;
    this.lift.position.y = this.altitude;
    this.shadow.sync(!this.shadows.realShadows, this.altitude);
  }
}
