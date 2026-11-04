import { MERCHANT_RULES, SIMULATION } from '@graveshift/shared/config';
import { directionTo, distanceSquared, vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2, SeededRandom } from '@graveshift/shared/core';
import {
  cellAt,
  cellCenter,
  CollisionLayer,
  FlowField,
  moveCircle,
  TileKind,
} from '@graveshift/shared/world';
import type { CellCoord, TileMap } from '@graveshift/shared/world';
import type { MerchantEntity } from '../entities/MerchantEntity.ts';

const POST_TILES: ReadonlySet<TileKind> = new Set([
  TileKind.Grass,
  TileKind.Road,
  TileKind.Merchant,
]);
const ARRIVAL_DISTANCE = 0.12;
const CALM_TICKS = Math.round(MERCHANT_RULES.calmSeconds * SIMULATION.tickRate);
const STEP = MERCHANT_RULES.walkSpeed * SIMULATION.tickSeconds;
const REROUTE_TICKS = Math.round(SIMULATION.tickRate / 2);
const STUCK_TICKS = Math.round(SIMULATION.tickRate * 1.5);
const PROGRESS_EPSILON = 0.05;

export class MerchantWalker {
  private readonly map: TileMap;
  private readonly random: SeededRandom;
  private readonly posts: readonly ReadonlyVec2[];
  private readonly route: FlowField;
  private readonly heading = vec2();
  private destination: ReadonlyVec2 | null = null;
  private calmTicksLeft = 0;
  private rerouteTicksLeft = 0;
  private closestDistance = Number.POSITIVE_INFINITY;
  private stuckTicks = 0;

  constructor(map: TileMap, random: SeededRandom, home: ReadonlyVec2) {
    this.map = map;
    this.random = random;
    this.route = new FlowField(map);
    this.posts = this.reachablePosts(cellAt(home));
  }

  get isWalking(): boolean {
    return this.destination !== null;
  }

  startle(merchant: MerchantEntity): void {
    if (this.isWalking || this.calmTicksLeft > 0) {
      return;
    }
    const farEnough = this.posts.filter(
      (post) => distanceSquared(post, merchant.position) >= MERCHANT_RULES.minHop ** 2,
    );
    if (farEnough.length === 0) {
      return;
    }
    this.destination = this.random.pick(farEnough);
    this.closestDistance = Number.POSITIVE_INFINITY;
    this.stuckTicks = 0;
    this.reroute(this.destination);
  }

  step(merchant: MerchantEntity): void {
    if (this.calmTicksLeft > 0) {
      this.calmTicksLeft -= 1;
    }
    const destination = this.destination;
    if (destination === null) {
      return;
    }
    const position = merchant.position;
    if (distanceSquared(position, destination) <= ARRIVAL_DISTANCE ** 2) {
      position.x = destination.x;
      position.y = destination.y;
      this.rest();
      return;
    }
    if (this.isStuck(Math.sqrt(distanceSquared(position, destination)))) {
      this.rest();
      return;
    }
    this.rerouteTicksLeft -= 1;
    if (this.rerouteTicksLeft <= 0) {
      this.reroute(destination);
    }
    const sameCell =
      Math.floor(position.x) === Math.floor(destination.x) &&
      Math.floor(position.y) === Math.floor(destination.y);
    if (sameCell || !this.route.directionAt(position, this.heading)) {
      directionTo(position, destination, this.heading);
    }
    const step = Math.min(STEP, Math.sqrt(distanceSquared(position, destination)));
    moveCircle(
      position,
      this.heading.x * step,
      this.heading.y * step,
      merchant.radius,
      this.map,
      CollisionLayer.Movement,
    );
  }

  private reroute(destination: ReadonlyVec2): void {
    this.route.rebuild([cellAt(destination)]);
    this.rerouteTicksLeft = REROUTE_TICKS;
  }

  private isStuck(remaining: number): boolean {
    if (remaining < this.closestDistance - PROGRESS_EPSILON) {
      this.closestDistance = remaining;
      this.stuckTicks = 0;
      return false;
    }
    this.stuckTicks += 1;
    return this.stuckTicks >= STUCK_TICKS;
  }

  private rest(): void {
    this.destination = null;
    this.calmTicksLeft = CALM_TICKS;
  }

  private reachablePosts(home: CellCoord): ReadonlyVec2[] {
    this.route.rebuild([home]);
    const middle = { x: this.map.width / 2, y: this.map.height / 2 };
    const posts: ReadonlyVec2[] = [];
    for (let index = 0; index < this.map.cellCount; index += 1) {
      const cell = this.map.cellOfIndex(index);
      const center = cellCenter(cell);
      const nearMiddle = distanceSquared(center, middle) <= MERCHANT_RULES.postRadius ** 2;
      const reachable = Number.isFinite(this.route.distanceAt(cell.cx, cell.cy));
      if (nearMiddle && reachable && POST_TILES.has(this.map.kindAt(cell.cx, cell.cy))) {
        posts.push(center);
      }
    }
    return posts;
  }
}
