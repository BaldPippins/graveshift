import { InstancedMesh, Matrix4 } from 'three';
import { isMesh } from '../../assets/meshMaterials.ts';
import type { Group, Object3D } from 'three';
import type { ModelKey } from '../../assets/ModelKey.ts';

interface Placement {
  readonly transform: Matrix4;
  readonly key: number | null;
}

interface InstanceSlot {
  readonly mesh: InstancedMesh;
  readonly index: number;
  readonly matrix: Matrix4;
}

const HIDDEN = new Matrix4().makeScale(0, 0, 0);

export class InstancedPropBatcher {
  private readonly placements = new Map<ModelKey, Placement[]>();
  private readonly slots = new Map<number, InstanceSlot[]>();

  add(model: ModelKey, transform: Matrix4, key: number | null = null): void {
    const list = this.placements.get(model) ?? [];
    list.push({ transform, key });
    this.placements.set(model, list);
  }

  build(target: Group, prototypeOf: (model: ModelKey) => Object3D, castShadows: boolean): void {
    for (const [model, placements] of this.placements) {
      const prototype = prototypeOf(model);
      prototype.updateMatrixWorld(true);
      prototype.traverse((child) => {
        if (!isMesh(child)) {
          return;
        }
        const instanced = new InstancedMesh(child.geometry, child.material, placements.length);
        placements.forEach((placement, index) => {
          const matrix = new Matrix4().multiplyMatrices(placement.transform, child.matrixWorld);
          instanced.setMatrixAt(index, matrix);
          this.remember(placement.key, { mesh: instanced, index, matrix });
        });
        instanced.instanceMatrix.needsUpdate = true;
        instanced.castShadow = castShadows;
        instanced.receiveShadow = true;
        instanced.computeBoundingSphere();
        target.add(instanced);
      });
    }
  }

  setVisible(key: number, visible: boolean): void {
    for (const slot of this.slots.get(key) ?? []) {
      slot.mesh.setMatrixAt(slot.index, visible ? slot.matrix : HIDDEN);
      slot.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  hideAll(): void {
    for (const key of this.slots.keys()) {
      this.setVisible(key, false);
    }
  }

  private remember(key: number | null, slot: InstanceSlot): void {
    if (key === null) {
      return;
    }
    const list = this.slots.get(key) ?? [];
    list.push(slot);
    this.slots.set(key, list);
  }
}
