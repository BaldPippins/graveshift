import { Material, Mesh } from 'three';
import type { Object3D } from 'three';

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? (value as unknown[]) : [value];
}

export function meshMaterials(mesh: Mesh): Material[] {
  return asList(mesh.material).filter(
    (material): material is Material => material instanceof Material,
  );
}

export function replaceMeshMaterials(mesh: Mesh, replace: (material: Material) => Material): void {
  const replaced = meshMaterials(mesh).map(replace);
  const [single] = replaced;
  mesh.material = replaced.length === 1 && single !== undefined ? single : replaced;
}

export function isMesh(object: Object3D): object is Mesh {
  return object instanceof Mesh;
}
