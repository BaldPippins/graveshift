import { Group } from 'three';
import type { Mesh } from 'three';
import { describe, expect, it } from 'vitest';
import { RangedWeaponId } from '@graveshift/shared/config';
import { TRACER_STYLES, TracerShape } from '../../../content/tracerContent.ts';
import { TracerFactory } from './TracerFactory.ts';
import { TracerPool } from './TracerPool.ts';

function visibleStrips(parent: Group): Mesh[] {
  return parent.children.filter((child): child is Mesh => child.visible && 'material' in child);
}

describe('TracerPool', () => {
  const factory = new TracerFactory();

  it('draws the holy rifle as a lingering beam with a bright core', () => {
    const parent = new Group();
    const pool = new TracerPool(parent);
    pool.spawn(0, 0, 10, 0, factory.kindOf(RangedWeaponId.Rifle));
    pool.update(TRACER_STYLES[RangedWeaponId.Pistol].lifetimeSeconds);
    const strips = visibleStrips(parent);
    expect(strips).toHaveLength(2);
    expect(strips.every((strip) => strip.scale.x === 10)).toBe(true);
  });

  it('flies a short smg bolt from the muzzle toward the hit', () => {
    const parent = new Group();
    const pool = new TracerPool(parent);
    const style = TRACER_STYLES[RangedWeaponId.Smg];
    const boltLength = style.shape.kind === TracerShape.Bolt ? style.shape.length : 0;
    pool.spawn(0, 0, 10, 0, factory.kindOf(RangedWeaponId.Smg));
    const [bolt] = visibleStrips(parent);
    const startX = bolt === undefined ? Number.NaN : bolt.position.x;
    pool.update(style.lifetimeSeconds / 2);
    expect(visibleStrips(parent)).toHaveLength(1);
    expect(bolt === undefined ? 0 : bolt.scale.x).toBeCloseTo(boltLength);
    expect(bolt === undefined ? 0 : bolt.position.x).toBeGreaterThan(startX + 3);
    pool.update(style.lifetimeSeconds);
    expect(visibleStrips(parent)).toHaveLength(0);
  });

  it('shares one tracer kind per weapon', () => {
    expect(factory.kindOf(RangedWeaponId.Gatling)).toBe(factory.kindOf(RangedWeaponId.Gatling));
  });
});
