import { Box3, Group, MeshStandardMaterial, Vector3 } from 'three';
import type { Material, Object3D } from 'three';
import { isMesh, meshMaterials } from './meshMaterials.ts';
import { ModelFit } from './ModelSpec.ts';
import type { ModelSpec } from './ModelSpec.ts';

const MATTE_ROUGHNESS = 0.85;

function measure(object: Object3D): Box3 {
  object.updateMatrixWorld(true);
  return new Box3().setFromObject(object);
}

function scaleFor(spec: ModelSpec, size: Vector3): number {
  switch (spec.fit) {
    case ModelFit.Height:
      return spec.size / Math.max(size.y, 1e-6);
    case ModelFit.Footprint:
      return spec.size / Math.max(size.x, size.z, 1e-6);
    case ModelFit.Longest:
      return spec.size / Math.max(size.x, size.y, size.z, 1e-6);
  }
}

function matte(material: Material): void {
  if (material instanceof MeshStandardMaterial) {
    material.roughness = MATTE_ROUGHNESS;
    material.metalness = 0;
  }
}

export function normalizeModel(scene: Object3D, spec: ModelSpec): Object3D {
  const size = measure(scene).getSize(new Vector3());
  scene.scale.multiplyScalar(scaleFor(spec, size));
  const bounds = measure(scene);
  const center = bounds.getCenter(new Vector3());
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= bounds.min.y;
  scene.traverse((child) => {
    if (isMesh(child)) {
      child.castShadow = true;
      child.receiveShadow = true;
      meshMaterials(child).forEach(matte);
    }
  });
  const pivot = new Group();
  pivot.add(scene);
  pivot.updateMatrixWorld(true);
  return pivot;
}
