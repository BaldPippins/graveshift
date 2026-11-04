import { describe, expect, it } from 'vitest';
import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial, Texture } from 'three';
import { MAX_UPGRADE_GRADE } from '@graveshift/shared/rules';
import { WeaponFinish } from './WeaponFinish.ts';

const TINT = 0xff3300;

interface TestGun {
  readonly model: Group;
  readonly mesh: Mesh;
}

function gun(): TestGun {
  const model = new Group();
  const mesh = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: 0xffffff }));
  model.add(mesh);
  return { model, mesh };
}

function materialOf(mesh: Mesh): MeshStandardMaterial {
  const material = mesh.material;
  if (!(material instanceof MeshStandardMaterial)) {
    throw new Error('Expected a standard material');
  }
  return material;
}

describe('WeaponFinish', () => {
  it('leaves an untouched weapon as it is', () => {
    const { model, mesh } = gun();
    const finish = new WeaponFinish(model, TINT, new Texture());
    finish.setGrade(0);
    finish.glow(0.1);
    expect(materialOf(mesh).color.equals(new Color(0xffffff))).toBe(true);
    expect(materialOf(mesh).emissiveIntensity).toBe(0);
  });

  it('tints more with every upgrade and glows only when maxed', () => {
    const { model, mesh } = gun();
    const finish = new WeaponFinish(model, TINT, new Texture());
    finish.setGrade(3);
    finish.glow(0.1);
    const partial = materialOf(mesh).emissiveIntensity;
    expect(partial).toBeGreaterThan(0);
    expect(finish.isMaxed).toBe(false);
    finish.setGrade(MAX_UPGRADE_GRADE);
    finish.glow(0.1);
    expect(finish.isMaxed).toBe(true);
    expect(materialOf(mesh).emissiveIntensity).toBeGreaterThan(partial);
    expect(materialOf(mesh).emissive.equals(new Color(TINT))).toBe(true);
  });
});
