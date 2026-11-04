import type {
  GltfAccessor,
  GltfAnimation,
  GltfBufferView,
  GltfChannel,
  GltfMaterial,
  GltfMesh,
  GltfNode,
  GltfSampler,
} from './GltfDocument.ts';

const FLOAT = 5126;
const UNSIGNED_SHORT = 5123;
const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;
const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;
const ALIGNMENT = 4;
const LINEAR = 'LINEAR';

const BOX_FACES: readonly (readonly number[])[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export interface Box {
  readonly center: readonly number[];
  readonly size: readonly number[];
  readonly material: number;
}

export interface Keyframes {
  readonly node: number;
  readonly path: 'rotation' | 'translation';
  readonly times: readonly number[];
  readonly values: readonly (readonly number[])[];
}

interface BoxGeometry {
  readonly positions: number[];
  readonly normals: number[];
  readonly indices: number[];
}

function padded(length: number): number {
  return Math.ceil(length / ALIGNMENT) * ALIGNMENT;
}

function axisOf(normal: readonly number[]): number {
  return normal.findIndex((component) => component !== 0);
}

function faceCorners(normal: readonly number[]): number[][] {
  const axis = axisOf(normal);
  const sign = normal[axis] ?? 1;
  const u = (axis + 1) % 3;
  const v = (axis + 2) % 3;
  const corners: number[][] = [];
  for (const [du, dv] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const) {
    const corner = [0, 0, 0];
    corner[axis] = sign;
    corner[u] = du * sign;
    corner[v] = dv;
    corners.push(corner);
  }
  return corners;
}

function boxGeometry(box: Box): BoxGeometry {
  const geometry: BoxGeometry = { positions: [], normals: [], indices: [] };
  for (const normal of BOX_FACES) {
    const base = geometry.positions.length / 3;
    for (const corner of faceCorners(normal)) {
      for (let axis = 0; axis < 3; axis += 1) {
        const half = (box.size[axis] ?? 0) / 2;
        geometry.positions.push((box.center[axis] ?? 0) + (corner[axis] ?? 0) * half);
        geometry.normals.push(normal[axis] ?? 0);
      }
    }
    geometry.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return geometry;
}

function boundsOf(values: readonly number[], components: number): number[][] {
  const min = Array.from({ length: components }, () => Number.POSITIVE_INFINITY);
  const max = Array.from({ length: components }, () => Number.NEGATIVE_INFINITY);
  values.forEach((value, index) => {
    const component = index % components;
    min[component] = Math.min(min[component] ?? value, value);
    max[component] = Math.max(max[component] ?? value, value);
  });
  return [min, max];
}

export class GlbBuilder {
  private readonly chunks: Uint8Array[] = [];
  private byteLength = 0;
  private readonly bufferViews: GltfBufferView[] = [];
  private readonly accessors: GltfAccessor[] = [];
  private readonly meshes: GltfMesh[] = [];
  private readonly nodes: GltfNode[] = [];
  private readonly materials: GltfMaterial[] = [];
  private readonly animations: GltfAnimation[] = [];

  addMaterial(name: string, color: number, emissive: boolean): number {
    const linear = [16, 8, 0]
      .map((shift) => ((color >> shift) & 0xff) / 255)
      .map((channel) => {
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
    this.materials.push({
      name,
      pbrMetallicRoughness: {
        baseColorFactor: [...linear, 1],
        metallicFactor: 0,
        roughnessFactor: 0.9,
      },
      ...(emissive ? { emissiveFactor: linear } : {}),
    });
    return this.materials.length - 1;
  }

  addNode(name: string, translation: readonly number[], boxes: readonly Box[]): number {
    const mesh = boxes.length === 0 ? undefined : this.addBoxes(name, boxes);
    this.nodes.push({ name, translation, ...(mesh === undefined ? {} : { mesh }) });
    return this.nodes.length - 1;
  }

  attach(parent: number, children: readonly number[]): void {
    const node = this.nodes[parent];
    if (node !== undefined) {
      this.nodes[parent] = { ...node, children: [...(node.children ?? []), ...children] };
    }
  }

  addAnimation(name: string, tracks: readonly Keyframes[]): void {
    const samplers: GltfSampler[] = [];
    const channels: GltfChannel[] = [];
    for (const track of tracks) {
      const input = this.addFloatAccessor(track.times, 'SCALAR', 1, undefined, true);
      const width = track.path === 'rotation' ? 4 : 3;
      const output = this.addFloatAccessor(
        track.values.flat(),
        width === 4 ? 'VEC4' : 'VEC3',
        width,
        undefined,
        false,
      );
      samplers.push({ input, output, interpolation: LINEAR });
      channels.push({
        sampler: samplers.length - 1,
        target: { node: track.node, path: track.path },
      });
    }
    this.animations.push({ name, samplers, channels });
  }

  build(rootNode: number): Uint8Array {
    const document = {
      asset: { version: '2.0', generator: 'graveshift' },
      scene: 0,
      scenes: [{ nodes: [rootNode] }],
      nodes: this.nodes,
      meshes: this.meshes,
      materials: this.materials,
      accessors: this.accessors,
      bufferViews: this.bufferViews,
      buffers: [{ byteLength: this.byteLength }],
      animations: this.animations,
    };
    const json = new TextEncoder().encode(JSON.stringify(document));
    const jsonLength = padded(json.length);
    const binLength = padded(this.byteLength);
    const total = 12 + 8 + jsonLength + 8 + binLength;
    const glb = new Uint8Array(total);
    const view = new DataView(glb.buffer);
    view.setUint32(0, GLB_MAGIC, true);
    view.setUint32(4, GLB_VERSION, true);
    view.setUint32(8, total, true);
    view.setUint32(12, jsonLength, true);
    view.setUint32(16, JSON_CHUNK, true);
    glb.fill(0x20, 20, 20 + jsonLength);
    glb.set(json, 20);
    const binStart = 20 + jsonLength;
    view.setUint32(binStart, binLength, true);
    view.setUint32(binStart + 4, BIN_CHUNK, true);
    let offset = binStart + 8;
    for (const chunk of this.chunks) {
      glb.set(chunk, offset);
      offset += padded(chunk.length);
    }
    return glb;
  }

  private addBoxes(name: string, boxes: readonly Box[]): number {
    const primitives = boxes.map((box) => {
      const geometry = boxGeometry(box);
      return {
        attributes: {
          POSITION: this.addFloatAccessor(geometry.positions, 'VEC3', 3, ARRAY_BUFFER, true),
          NORMAL: this.addFloatAccessor(geometry.normals, 'VEC3', 3, ARRAY_BUFFER, false),
        },
        indices: this.addIndexAccessor(geometry.indices),
        material: box.material,
      };
    });
    this.meshes.push({ name, primitives });
    return this.meshes.length - 1;
  }

  private addFloatAccessor(
    values: readonly number[],
    type: string,
    components: number,
    target: number | undefined,
    withBounds: boolean,
  ): number {
    const bufferView = this.addBufferView(new Uint8Array(new Float32Array(values).buffer), target);
    const [min, max] = boundsOf(values, components);
    this.accessors.push({
      bufferView,
      componentType: FLOAT,
      count: values.length / components,
      type,
      ...(withBounds && min !== undefined && max !== undefined ? { min, max } : {}),
    });
    return this.accessors.length - 1;
  }

  private addIndexAccessor(indices: readonly number[]): number {
    const bufferView = this.addBufferView(
      new Uint8Array(new Uint16Array(indices).buffer),
      ELEMENT_ARRAY_BUFFER,
    );
    this.accessors.push({
      bufferView,
      componentType: UNSIGNED_SHORT,
      count: indices.length,
      type: 'SCALAR',
    });
    return this.accessors.length - 1;
  }

  private addBufferView(bytes: Uint8Array, target: number | undefined): number {
    this.bufferViews.push({
      buffer: 0,
      byteOffset: this.byteLength,
      byteLength: bytes.length,
      ...(target === undefined ? {} : { target }),
    });
    this.chunks.push(bytes);
    this.byteLength += padded(bytes.length);
    return this.bufferViews.length - 1;
  }
}
