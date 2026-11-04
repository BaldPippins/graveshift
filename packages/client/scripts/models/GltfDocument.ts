export interface GltfAccessor {
  readonly bufferView: number;
  readonly componentType: number;
  readonly count: number;
  readonly type: string;
  readonly min?: readonly number[];
  readonly max?: readonly number[];
}

export interface GltfBufferView {
  readonly buffer: number;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly target?: number;
}

export interface GltfNode {
  readonly name: string;
  readonly mesh?: number;
  readonly translation?: readonly number[];
  readonly children?: readonly number[];
}

export interface GltfPrimitive {
  readonly attributes: Readonly<Record<string, number>>;
  readonly indices: number;
  readonly material: number;
}

export interface GltfMesh {
  readonly name: string;
  readonly primitives: readonly GltfPrimitive[];
}

export interface GltfPbr {
  readonly baseColorFactor: readonly number[];
  readonly metallicFactor: number;
  readonly roughnessFactor: number;
}

export interface GltfMaterial {
  readonly name: string;
  readonly pbrMetallicRoughness: GltfPbr;
  readonly emissiveFactor?: readonly number[];
}

export interface GltfSampler {
  readonly input: number;
  readonly output: number;
  readonly interpolation: string;
}

export interface GltfChannelTarget {
  readonly node: number;
  readonly path: string;
}

export interface GltfChannel {
  readonly sampler: number;
  readonly target: GltfChannelTarget;
}

export interface GltfAnimation {
  readonly name: string;
  readonly samplers: readonly GltfSampler[];
  readonly channels: readonly GltfChannel[];
}
