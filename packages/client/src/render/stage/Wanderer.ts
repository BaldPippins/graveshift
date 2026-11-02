import { distanceSquared, exponentialDecayFactor, lerpAngle, vec2 } from '@graveshift/shared/core';
import type { SeededRandom } from '@graveshift/shared/core';
import { CollisionLayer, FlowField, moveCircle } from '@graveshift/shared/world';
import type { CellCoord, TileMap } from '@graveshift/shared/world';
import type { CharacterRig } from '../characters/CharacterRig.ts';
import { yawFromAngle } from '../space.ts';

const WALK_SPEED = 1.1;
const BODY_RADIUS = 0.3;
const ARRIVAL_DISTANCE = 0.35;
const TURN_SHARPNESS = 8;

export class Wanderer {
  private readonly rig: CharacterRig;
  private readonly map: TileMap;
  private readonly random: SeededRandom;
  private readonly openCells: readonly CellCoord[];
  private readonly flow: FlowField;
  private readonly phasesThroughWalls: boolean;
  private readonly position = vec2();
  private readonly heading = vec2();
  private readonly destination = vec2();
  private yaw = 0;

  constructor(
    rig: CharacterRig,
    map: TileMap,
    random: SeededRandom,
    openCells: readonly CellCoord[],
    phasesThroughWalls: boolean,
  ) {
    this.rig = rig;
    this.phasesThroughWalls = phasesThroughWalls;
    this.map = map;
    this.random = random;
    this.openCells = openCells;
    this.flow = new FlowField(map);
    const start = this.randomCell();
    this.position.x = start.cx + 0.5;
    this.position.y = start.cy + 0.5;
    this.chooseDestination();
  }

  update(deltaSeconds: number): void {
    const arrived =
      distanceSquared(this.position, this.destination) < ARRIVAL_DISTANCE * ARRIVAL_DISTANCE;
    if (arrived || !this.steer()) {
      this.chooseDestination();
    }
    this.advance(WALK_SPEED * deltaSeconds);
    this.yaw = lerpAngle(
      this.yaw,
      yawFromAngle(Math.atan2(this.heading.y, this.heading.x)),
      exponentialDecayFactor(TURN_SHARPNESS, deltaSeconds),
    );
    this.rig.root.position.set(this.position.x, 0, this.position.y);
    this.rig.root.rotation.y = this.yaw;
    this.rig.update(deltaSeconds);
  }

  private steer(): boolean {
    if (!this.phasesThroughWalls) {
      return this.flow.directionAt(this.position, this.heading);
    }
    const length = Math.sqrt(distanceSquared(this.position, this.destination));
    if (length < 1e-6) {
      return false;
    }
    this.heading.x = (this.destination.x - this.position.x) / length;
    this.heading.y = (this.destination.y - this.position.y) / length;
    return true;
  }

  private advance(step: number): void {
    if (this.phasesThroughWalls) {
      this.position.x += this.heading.x * step;
      this.position.y += this.heading.y * step;
      return;
    }
    moveCircle(
      this.position,
      this.heading.x * step,
      this.heading.y * step,
      BODY_RADIUS,
      this.map,
      CollisionLayer.Movement,
    );
  }

  private chooseDestination(): void {
    const cell = this.randomCell();
    this.destination.x = cell.cx + 0.5;
    this.destination.y = cell.cy + 0.5;
    if (!this.phasesThroughWalls) {
      this.flow.rebuild([cell]);
    }
  }

  private randomCell(): CellCoord {
    const cell = this.openCells[this.random.integer(0, this.openCells.length)];
    if (cell === undefined) {
      throw new Error('Map has no open cells to wander');
    }
    return cell;
  }
}
