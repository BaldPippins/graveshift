import { RANGED_WEAPON_IDS } from '@graveshift/shared/config';
import type { RangedWeaponId } from '@graveshift/shared/config';
import { assertNever } from '@graveshift/shared/core';
import { TRACER_STYLES, TracerShape } from '../../../content/tracerContent.ts';
import type { TracerStyle } from '../../../content/tracerContent.ts';
import { FadingBeam } from './FadingBeam.ts';
import { FlyingBolt } from './FlyingBolt.ts';
import type { TracerKind } from './TracerKind.ts';
import type { TracerMotion } from './TracerMotion.ts';

function createMotion(style: TracerStyle): TracerMotion {
  const shape = style.shape;
  switch (shape.kind) {
    case TracerShape.Beam:
      return new FadingBeam(style.lifetimeSeconds);
    case TracerShape.Bolt:
      return new FlyingBolt(style.lifetimeSeconds, shape.length);
    default:
      return assertNever(shape);
  }
}

export class TracerFactory {
  private readonly kinds = new Map<RangedWeaponId, TracerKind>();

  constructor(styles: Readonly<Record<RangedWeaponId, TracerStyle>> = TRACER_STYLES) {
    for (const weapon of RANGED_WEAPON_IDS) {
      const style = styles[weapon];
      this.kinds.set(weapon, { look: style.look, motion: createMotion(style) });
    }
  }

  kindOf(weapon: RangedWeaponId): TracerKind {
    const kind = this.kinds.get(weapon);
    if (kind === undefined) {
      throw new Error(`No tracer for weapon ${weapon}`);
    }
    return kind;
  }
}
