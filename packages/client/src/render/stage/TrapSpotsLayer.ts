import type { Object3D } from 'three';
import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { trapSpotNear, trapSpotsOf } from '@graveshift/shared/rules';
import type { TileMap } from '@graveshift/shared/world';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import type { TrapFrame } from '../../game/view/WorldFrame.ts';
import { TrapSpotView } from './TrapSpotView.ts';

const SIGN_RADIUS = 4.5;
import type { TrapSignSources } from './TrapSpotView.ts';

export class TrapSpotsLayer {
  private readonly views: readonly TrapSpotView[];

  constructor(parent: Object3D, assets: AssetLibrary, map: TileMap, texts: TrapSignSources) {
    this.views = trapSpotsOf(map).map((spot) => new TrapSpotView(parent, assets, spot, texts));
  }

  onSignActivated(handler: () => void): void {
    for (const view of this.views) {
      view.onSignActivated(handler);
    }
  }

  setTouchPrompts(enabled: boolean): void {
    for (const view of this.views) {
      view.setTouchPrompts(enabled);
    }
  }

  setVisible(visible: boolean): void {
    for (const view of this.views) {
      view.setVisible(visible);
    }
  }

  sync(
    traps: readonly TrapFrame[],
    local: ReadonlyVec2 | null,
    wave: number,
    deltaSeconds: number,
  ): void {
    const byCell = new Map(traps.map((trap) => [trap.cell, trap]));
    const nearest =
      local === null
        ? null
        : trapSpotNear(
            local,
            this.views.map((view) => view.spot),
          );
    for (const view of this.views) {
      const inSight =
        local !== null && distanceSquared(local, view.spot.center) <= SIGN_RADIUS ** 2;
      view.sync(byCell.get(view.spot.index), {
        near: nearest === view.spot,
        inSight,
        wave,
        deltaSeconds,
      });
    }
  }
}
