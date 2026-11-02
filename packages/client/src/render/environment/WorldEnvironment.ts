import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';
import type { Scene } from 'three';
import type { TileMap } from '@graveshift/shared/world';
import { PALETTE } from '../../content/palette.ts';

const NIGHT_SKY = PALETTE.nightSky;
const GROUND_COLOR = 0x2f4a2c;
const OUTSKIRTS_COLOR = 0x18241a;
const MOON_COLOR = 0xb8c4ff;
const SHADOW_MAP_SIZE = 2048;
const OUTSKIRTS_MARGIN = 40;

function createGround(
  width: number,
  depth: number,
  color: number,
  height: number,
  centerX: number,
  centerZ: number,
): Mesh {
  const ground = new Mesh(
    new PlaneGeometry(width, depth),
    new MeshStandardMaterial({ color, roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(centerX, height, centerZ);
  ground.receiveShadow = true;
  return ground;
}

export class WorldEnvironment {
  readonly moon: DirectionalLight;

  constructor(scene: Scene, map: TileMap) {
    scene.background = new Color(NIGHT_SKY);
    scene.fog = new Fog(NIGHT_SKY, 22, 55);
    scene.add(new HemisphereLight(0x9aa8ff, 0x3a4a33, 2.6), new AmbientLight(0x6070a0, 0.8));

    this.moon = new DirectionalLight(MOON_COLOR, 2.2);
    const centerX = map.width / 2;
    const centerZ = map.height / 2;
    this.moon.position.set(centerX - 10, 22, centerZ - 14);
    this.moon.target.position.set(centerX, 0, centerZ);
    this.moon.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    const halfExtent = Math.max(map.width, map.height) / 2 + 2;
    this.moon.shadow.camera.left = -halfExtent;
    this.moon.shadow.camera.right = halfExtent;
    this.moon.shadow.camera.top = halfExtent;
    this.moon.shadow.camera.bottom = -halfExtent;
    this.moon.shadow.camera.far = 80;
    this.moon.shadow.bias = -0.0005;
    scene.add(this.moon, this.moon.target);

    scene.add(createGround(map.width, map.height, GROUND_COLOR, 0, centerX, centerZ));
    scene.add(
      createGround(
        map.width + OUTSKIRTS_MARGIN * 2,
        map.height + OUTSKIRTS_MARGIN * 2,
        OUTSKIRTS_COLOR,
        -0.02,
        centerX,
        centerZ,
      ),
    );
  }

  setShadows(enabled: boolean): void {
    this.moon.castShadow = enabled;
  }
}
