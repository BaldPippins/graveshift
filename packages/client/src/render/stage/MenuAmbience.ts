import { Group } from 'three';
import { ENEMIES, EnemyKind } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { CollisionLayer } from '@graveshift/shared/world';
import type { CellCoord, TileMap } from '@graveshift/shared/world';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { ENEMY_CONTENT } from '../../content/enemyContent.ts';
import { AnimationName } from '../characters/clipTools.ts';
import { createCharacterRig } from '../characters/createCharacterRig.ts';
import { Wanderer } from './Wanderer.ts';
import { enemyModelKey } from '../../assets/ModelKey.ts';

const WANDERERS: readonly EnemyKind[] = [
  EnemyKind.Zombie,
  EnemyKind.Skeleton,
  EnemyKind.Zombie,
  EnemyKind.Ghost,
  EnemyKind.Brute,
];
const AMBIENCE_SEED = 1337;

function openCellsOf(map: TileMap): CellCoord[] {
  const cells: CellCoord[] = [];
  for (let index = 0; index < map.cellCount; index += 1) {
    if (!map.isBlockedAtIndex(index, CollisionLayer.Movement)) {
      cells.push(map.cellOfIndex(index));
    }
  }
  return cells;
}

export class MenuAmbience {
  readonly root = new Group();
  private readonly walkers: Wanderer[];

  constructor(assets: AssetLibrary, map: TileMap) {
    const random = new SeededRandom(AMBIENCE_SEED);
    const openCells = openCellsOf(map);
    this.walkers = WANDERERS.map((kind) => {
      const content = ENEMY_CONTENT[kind];
      const rig = createCharacterRig(assets, enemyModelKey(kind), content.opacity);
      rig.playBase(AnimationName.Walk, { timeScale: 0.7 });
      this.root.add(rig.root);
      return new Wanderer(rig, map, random, openCells, ENEMIES[kind].phasesThroughWalls);
    });
  }

  update(deltaSeconds: number): void {
    for (const walker of this.walkers) {
      walker.update(deltaSeconds);
    }
  }
}
