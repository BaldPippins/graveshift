import { assertNever } from '@graveshift/shared/core';
import type { TileKind } from '@graveshift/shared/world';
import { DamageLook, damageLookOf } from '../../content/obstacleContent.ts';
import type { DamageMarker } from './DamageMarker.ts';
import { FlameKit } from './FlameKit.ts';
import { FlameMarker } from './FlameMarker.ts';

export class DamageMarkerFactory {
  private readonly flames = new FlameKit();

  create(kind: TileKind, cell: number): DamageMarker | null {
    const look = damageLookOf(kind);
    switch (look) {
      case DamageLook.Stone:
        return null;
      case DamageLook.Flames:
        return new FlameMarker(this.flames, cell);
      default:
        return assertNever(look);
    }
  }
}
