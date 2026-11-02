import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Quaternion,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import type { Scene } from 'three';
import type { TileKind, TileMap } from '@graveshift/shared/world';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { InstancedPropBatcher } from './InstancedPropBatcher.ts';
import { PATH_TILES, TILE_APPEARANCE, TileOrientation } from './tileAppearance.ts';
import type { TileGlow, TileAppearance } from './tileAppearance.ts';

const UP = new Vector3(0, 1, 0);
const JITTER_RADIANS = 0.3;
const MAX_POINT_LIGHTS = 6;
const PATH_COLOR = 0x4a3f33;
const PATH_HEIGHT = 0.01;

function cellHash(cx: number, cy: number): number {
  const hashed = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453;
  return hashed - Math.floor(hashed);
}

function createGlowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context !== null) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

export class MapView {
  readonly root = new Group();
  private readonly map: TileMap;
  private readonly lights: PointLight[] = [];

  constructor(scene: Scene, map: TileMap, assets: AssetLibrary, castShadows: boolean) {
    this.map = map;
    const batcher = new InstancedPropBatcher();
    const glowTexture = createGlowTexture();
    for (let cy = 0; cy < map.height; cy += 1) {
      for (let cx = 0; cx < map.width; cx += 1) {
        const appearance = TILE_APPEARANCE[map.kindAt(cx, cy)];
        if (appearance === null) {
          continue;
        }
        batcher.add(appearance.model, this.transformFor(appearance, cx, cy));
        if (appearance.glow !== null) {
          this.addGlow(appearance.glow, cx, cy, glowTexture);
        }
      }
    }
    batcher.build(this.root, (model) => assets.prototype(model), castShadows);
    this.root.add(this.createPaths());
    scene.add(this.root);
  }

  private createPaths(): InstancedMesh {
    const cells: Matrix4[] = [];
    for (let cy = 0; cy < this.map.height; cy += 1) {
      for (let cx = 0; cx < this.map.width; cx += 1) {
        if (PATH_TILES.has(this.map.kindAt(cx, cy))) {
          cells.push(new Matrix4().makeTranslation(cx + 0.5, PATH_HEIGHT, cy + 0.5));
        }
      }
    }
    const geometry = new PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);
    const paths = new InstancedMesh(
      geometry,
      new MeshStandardMaterial({ color: PATH_COLOR, roughness: 1, metalness: 0 }),
      cells.length,
    );
    cells.forEach((matrix, index) => {
      paths.setMatrixAt(index, matrix);
    });
    paths.receiveShadow = true;
    return paths;
  }

  setPointLightsEnabled(enabled: boolean): void {
    for (const light of this.lights) {
      light.visible = enabled;
    }
  }

  private transformFor(appearance: TileAppearance, cx: number, cy: number): Matrix4 {
    const rotation = new Quaternion().setFromAxisAngle(
      UP,
      this.yawFor(appearance.orientation, cx, cy),
    );
    return new Matrix4().compose(
      new Vector3(cx + 0.5, 0, cy + 0.5),
      rotation,
      new Vector3(1, 1, 1),
    );
  }

  private yawFor(orientation: TileOrientation, cx: number, cy: number): number {
    switch (orientation) {
      case TileOrientation.Fixed:
        return 0;
      case TileOrientation.Jitter:
        return (cellHash(cx, cy) - 0.5) * JITTER_RADIANS;
      case TileOrientation.Random:
        return cellHash(cx, cy) * Math.PI * 2;
      case TileOrientation.AlongNeighbors:
        return this.runsVertically(cx, cy) ? Math.PI / 2 : 0;
    }
  }

  private runsVertically(cx: number, cy: number): boolean {
    const kind = this.map.kindAt(cx, cy);
    const horizontal = this.isKindAt(cx - 1, cy, kind) || this.isKindAt(cx + 1, cy, kind);
    const vertical = this.isKindAt(cx, cy - 1, kind) || this.isKindAt(cx, cy + 1, kind);
    return vertical && !horizontal;
  }

  private isKindAt(cx: number, cy: number, kind: TileKind): boolean {
    return this.map.isInside(cx, cy) && this.map.kindAt(cx, cy) === kind;
  }

  private addGlow(glow: TileGlow, cx: number, cy: number, texture: CanvasTexture): void {
    const sprite = new Sprite(
      new SpriteMaterial({
        map: texture,
        color: glow.color,
        blending: AdditiveBlending,
        depthWrite: false,
        transparent: true,
      }),
    );
    sprite.position.set(cx + 0.5, glow.height, cy + 0.5);
    sprite.scale.setScalar(glow.size);
    this.root.add(sprite);
    if (glow.castsLight && this.lights.length < MAX_POINT_LIGHTS) {
      const light = new PointLight(glow.color, 6, 7, 1.6);
      light.position.set(cx + 0.5, glow.height + 0.3, cy + 0.5);
      this.lights.push(light);
      this.root.add(light);
    }
  }
}
