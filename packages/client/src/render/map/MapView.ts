import {
  AdditiveBlending,
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
import type { CanvasTexture, Object3D, Scene } from 'three';
import { isDestructibleTile } from '@graveshift/shared/world';
import type { TileKind, TileMap } from '@graveshift/shared/world';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import type { ModelKey } from '../../assets/ModelKey.ts';
import { wreckModelOf } from '../../content/obstacleContent.ts';
import { createGlowTexture } from '../effects/glowTexture.ts';
import { InstancedPropBatcher } from './InstancedPropBatcher.ts';
import { PATH_TILES, TILE_APPEARANCE, TileOrientation } from './tileAppearance.ts';
import type { TileGlow, TileAppearance } from './tileAppearance.ts';

const UP = new Vector3(0, 1, 0);
const JITTER_RADIANS = 0.3;
const MAX_POINT_LIGHTS = 6;
const LAMP_LIGHT_INTENSITY = 6;
const PATH_COLOR = 0x4a3f33;
const PATH_HEIGHT = 0.01;

function cellHash(cx: number, cy: number): number {
  const hashed = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453;
  return hashed - Math.floor(hashed);
}

export class MapView {
  readonly root = new Group();
  private readonly map: TileMap;
  private readonly lights = new Map<PointLight, number>();
  private readonly glows = new Map<number, Sprite>();
  private readonly wrecked = new Set<number>();
  private pointLightsEnabled = true;
  private readonly props = new InstancedPropBatcher();
  private readonly rubble = new InstancedPropBatcher();

  constructor(scene: Scene, map: TileMap, assets: AssetLibrary, castShadows: boolean) {
    this.map = map;
    const glowTexture = createGlowTexture();
    for (let cy = 0; cy < map.height; cy += 1) {
      for (let cx = 0; cx < map.width; cx += 1) {
        this.placeTile(cx, cy, glowTexture);
      }
    }
    const prototypeOf = (model: ModelKey): Object3D => assets.prototype(model);
    this.props.build(this.root, prototypeOf, castShadows);
    this.rubble.build(this.root, prototypeOf, castShadows);
    this.rubble.hideAll();
    this.root.add(this.createPaths());
    scene.add(this.root);
    this.freezeTransforms();
  }

  setWrecked(cell: number, wrecked: boolean): void {
    this.props.setVisible(cell, !wrecked);
    this.rubble.setVisible(cell, wrecked);
    if (wrecked) {
      this.wrecked.add(cell);
    } else {
      this.wrecked.delete(cell);
    }
    const glow = this.glows.get(cell);
    if (glow !== undefined) {
      glow.visible = !wrecked;
    }
    this.refreshLights();
  }

  private placeTile(cx: number, cy: number, glowTexture: CanvasTexture): void {
    const kind = this.map.kindAt(cx, cy);
    const appearance = TILE_APPEARANCE[kind];
    if (appearance === null) {
      return;
    }
    const destructible = isDestructibleTile(kind);
    const cell = destructible ? this.map.indexOf(cx, cy) : null;
    this.props.add(appearance.model, this.transformFor(appearance, cx, cy), cell);
    if (cell !== null) {
      this.rubble.add(wreckModelOf(kind), this.rubbleTransform(cx, cy), cell);
    }
    if (appearance.glow !== null) {
      this.addGlow(appearance.glow, cx, cy, glowTexture);
    }
  }

  private rubbleTransform(cx: number, cy: number): Matrix4 {
    const rotation = new Quaternion().setFromAxisAngle(UP, cellHash(cy, cx) * Math.PI * 2);
    return new Matrix4().compose(
      new Vector3(cx + 0.5, 0, cy + 0.5),
      rotation,
      new Vector3(1, 1, 1),
    );
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
    this.pointLightsEnabled = enabled;
    this.refreshLights();
  }

  private refreshLights(): void {
    for (const [light, cell] of this.lights) {
      light.visible = this.pointLightsEnabled;
      light.intensity = this.wrecked.has(cell) ? 0 : LAMP_LIGHT_INTENSITY;
    }
  }

  private freezeTransforms(): void {
    this.root.traverse((object) => {
      object.matrixAutoUpdate = false;
      object.updateMatrix();
    });
    this.root.updateMatrixWorld(true);
    this.root.matrixWorldAutoUpdate = false;
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
    const turns = this.map.orientationAt(cx, cy);
    if (turns !== undefined) {
      return (turns * Math.PI) / 2;
    }
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
    const cell = this.map.indexOf(cx, cy);
    this.glows.set(cell, sprite);
    if (glow.castsLight && this.lights.size < MAX_POINT_LIGHTS) {
      const light = new PointLight(glow.color, LAMP_LIGHT_INTENSITY, 7, 1.6);
      light.position.set(cx + 0.5, glow.height + 0.3, cy + 0.5);
      this.lights.set(light, cell);
      this.root.add(light);
    }
  }
}
