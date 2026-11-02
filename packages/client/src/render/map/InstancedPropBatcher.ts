import { InstancedMesh, Matrix4 } from 'three';
import { isMesh } from '../../assets/meshMaterials.ts';
import type { Group, Object3D } from 'three';
import type { ModelKey } from '../../assets/ModelKey.ts';

export class InstancedPropBatcher {
  private readonly placements = new Map<ModelKey, Matrix4[]>();

  add(model: ModelKey, transform: Matrix4): void {
    const list = this.placements.get(model) ?? [];
    list.push(transform);
    this.placements.set(model, list);
  }

  build(target: Group, prototypeOf: (model: ModelKey) => Object3D, castShadows: boolean): void {
    for (const [model, transforms] of this.placements) {
      const prototype = prototypeOf(model);
      prototype.updateMatrixWorld(true);
      prototype.traverse((child) => {
        if (!isMesh(child)) {
          return;
        }
        const instanced = new InstancedMesh(child.geometry, child.material, transforms.length);
        const combined = new Matrix4();
        transforms.forEach((transform, index) => {
          instanced.setMatrixAt(index, combined.multiplyMatrices(transform, child.matrixWorld));
        });
        instanced.instanceMatrix.needsUpdate = true;
        instanced.castShadow = castShadows;
        instanced.receiveShadow = true;
        instanced.computeBoundingSphere();
        target.add(instanced);
      });
    }
  }
}
