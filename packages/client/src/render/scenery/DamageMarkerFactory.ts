import type { Texture } from 'three';
import { assertNever } from '@graveshift/shared/core';
import type { TileKind } from '@graveshift/shared/world';
import { DamageLook, damageLookOf } from '../../content/obstacleContent.ts';
import { createGlowTexture } from '../effects/glowTexture.ts';
import { CrackMarker } from './CrackMarker.ts';
import type { DamageMarker } from './DamageMarker.ts';
import { FlameMarker } from './FlameMarker.ts';

export class DamageMarkerFactory {
  private readonly glow: Texture = createGlowTexture();

  create(kind: TileKind, cell: number): DamageMarker {
    const look = damageLookOf(kind);
    switch (look) {
      case DamageLook.Cracks:
        return new CrackMarker();
      case DamageLook.Flames:
        return new FlameMarker(this.glow, cell);
      default:
        return assertNever(look);
    }
  }
}
