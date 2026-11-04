import { RangedWeaponId } from '@graveshift/shared/config';
import type { ValueOf } from '@graveshift/shared/core';
import { WEAPON_CONTENT } from './weaponContent.ts';

export const TracerShape = {
  Beam: 'beam',
  Bolt: 'bolt',
} as const;
export type TracerShape = ValueOf<typeof TracerShape>;

export interface BeamShape {
  readonly kind: typeof TracerShape.Beam;
}

export interface BoltShape {
  readonly kind: typeof TracerShape.Bolt;
  readonly length: number;
}

export type TracerShapeSpec = BeamShape | BoltShape;

export interface TracerLook {
  readonly color: number;
  readonly coreColor: number | null;
  readonly width: number;
}

export interface TracerStyle {
  readonly look: TracerLook;
  readonly lifetimeSeconds: number;
  readonly shape: TracerShapeSpec;
}

const WHITE_CORE = 0xffffff;
const BEAM: BeamShape = { kind: TracerShape.Beam };

function look(weapon: RangedWeaponId, width: number, coreColor: number | null): TracerLook {
  return { color: WEAPON_CONTENT[weapon].color, coreColor, width };
}

function bolt(length: number): BoltShape {
  return { kind: TracerShape.Bolt, length };
}

export const TRACER_STYLES: Readonly<Record<RangedWeaponId, TracerStyle>> = {
  [RangedWeaponId.Pistol]: {
    look: look(RangedWeaponId.Pistol, 0.05, null),
    lifetimeSeconds: 0.07,
    shape: BEAM,
  },
  [RangedWeaponId.Smg]: {
    look: look(RangedWeaponId.Smg, 0.05, null),
    lifetimeSeconds: 0.09,
    shape: bolt(1.1),
  },
  [RangedWeaponId.Shotgun]: {
    look: look(RangedWeaponId.Shotgun, 0.09, null),
    lifetimeSeconds: 0.05,
    shape: BEAM,
  },
  [RangedWeaponId.Rifle]: {
    look: look(RangedWeaponId.Rifle, 0.16, WHITE_CORE),
    lifetimeSeconds: 0.22,
    shape: BEAM,
  },
  [RangedWeaponId.Gatling]: {
    look: look(RangedWeaponId.Gatling, 0.04, null),
    lifetimeSeconds: 0.07,
    shape: bolt(0.7),
  },
};
