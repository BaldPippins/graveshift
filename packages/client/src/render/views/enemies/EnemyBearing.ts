import type { Group } from 'three';

export interface EnemyBearing {
  attach(view: Group, lift: Group): void;
  update(diving: boolean, deltaSeconds: number): void;
  fall(deltaSeconds: number): void;
  dispose(): void;
}
