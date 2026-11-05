import type { Group } from 'three';
import { HealthBar } from '../views/HealthBar.ts';
import { OBSTACLE_HEALTH_BAR } from '../views/HealthBarStyle.ts';
import type { DamageMarker } from './DamageMarker.ts';

const BAR_HEIGHT = 1.05;

export class CrackMarker implements DamageMarker {
  readonly object: Group;
  private readonly bar = new HealthBar(BAR_HEIGHT, OBSTACLE_HEALTH_BAR);

  constructor() {
    this.object = this.bar.object;
  }

  setHealth(fraction: number): void {
    this.bar.setFraction(fraction);
  }

  update(): void {
    return;
  }

  dispose(): void {
    this.bar.dispose();
  }
}
