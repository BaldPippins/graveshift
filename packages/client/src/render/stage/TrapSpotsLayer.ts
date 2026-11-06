import type { Object3D } from 'three';
import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { trapSpotsOf } from '@graveshift/shared/rules';
import type { TileMap } from '@graveshift/shared/world';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import type { TrapFrame } from '../../game/view/WorldFrame.ts';
import { createGlowTexture } from '../effects/glowTexture.ts';
import { TrapSpotView } from './TrapSpotView.ts';
import type { TrapSignSources } from './TrapSpotView.ts';

const SIGN_RADIUS = 4.5;

export class TrapSpotsLayer {
  private readonly views: readonly TrapSpotView[];

  constructor(parent: Object3D, assets: AssetLibrary, map: TileMap, texts: TrapSignSources) {
    const glow = createGlowTexture();
    this.views = trapSpotsOf(map).map(
      (spot) => new TrapSpotView(parent, assets, spot, texts, glow),
    );
  }

  onSignActivated(handler: (cell: number) => void): void {
    for (const view of this.views) {
      view.onSignActivated(() => {
        handler(view.spot.index);
      });
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
    offered: number | null,
    wave: number,
    deltaSeconds: number,
  ): void {
    const byCell = new Map(traps.map((trap) => [trap.cell, trap]));
    for (const view of this.views) {
      const inSight =
        local !== null && distanceSquared(local, view.spot.center) <= SIGN_RADIUS ** 2;
      view.sync(byCell.get(view.spot.index), {
        near: offered === view.spot.index,
        inSight,
        wave,
        deltaSeconds,
      });
    }
  }
}
