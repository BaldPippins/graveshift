import { Group } from 'three';
import type { Object3D } from 'three';
import { cellCenter } from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import type { ObstacleFrame } from '../../game/view/WorldFrame.ts';
import type { MapView } from '../map/MapView.ts';
import type { DamageMarker } from './DamageMarker.ts';
import { DamageMarkerFactory } from './DamageMarkerFactory.ts';

export class ObstacleLayer {
  private readonly root = new Group();
  private readonly map: TileMap;
  private readonly mapView: MapView;
  private readonly markerFactory = new DamageMarkerFactory();
  private readonly markers = new Map<number, DamageMarker>();
  private readonly wrecked = new Set<number>();

  constructor(parent: Object3D, map: TileMap, mapView: MapView) {
    this.map = map;
    this.mapView = mapView;
    parent.add(this.root);
  }

  sync(obstacles: readonly ObstacleFrame[], deltaSeconds: number): void {
    const wreckedNow = new Set<number>();
    const damagedNow = new Set<number>();
    for (const obstacle of obstacles) {
      if (obstacle.wrecked) {
        wreckedNow.add(obstacle.cell);
        continue;
      }
      damagedNow.add(obstacle.cell);
      this.markerFor(obstacle.cell).setHealth(obstacle.healthFraction);
    }
    this.syncWrecks(wreckedNow);
    for (const [cell, marker] of this.markers) {
      if (!damagedNow.has(cell)) {
        this.root.remove(marker.object);
        marker.dispose();
        this.markers.delete(cell);
      }
    }
    for (const marker of this.markers.values()) {
      marker.update(deltaSeconds);
    }
  }

  private syncWrecks(wreckedNow: ReadonlySet<number>): void {
    for (const cell of [...this.wrecked]) {
      if (!wreckedNow.has(cell)) {
        this.wrecked.delete(cell);
        this.mapView.setWrecked(cell, false);
      }
    }
    for (const cell of wreckedNow) {
      if (!this.wrecked.has(cell)) {
        this.wrecked.add(cell);
        this.mapView.setWrecked(cell, true);
      }
    }
  }

  private markerFor(cell: number): DamageMarker {
    const existing = this.markers.get(cell);
    if (existing !== undefined) {
      return existing;
    }
    const coord = this.map.cellOfIndex(cell);
    const marker = this.markerFactory.create(this.map.kindAt(coord.cx, coord.cy), cell);
    const center = cellCenter(coord);
    marker.object.position.set(center.x, marker.object.position.y, center.y);
    this.root.add(marker.object);
    this.markers.set(cell, marker);
    return marker;
  }
}
