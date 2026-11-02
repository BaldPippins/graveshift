import { PLAYER_RULES, SIMULATION } from '@graveshift/shared/config';
import {
  angleBetween,
  directionFromAngle,
  directionTo,
  distance,
  distanceSquared,
  nearestTo,
  vec2,
  wrapAngle,
} from '@graveshift/shared/core';
import type { ReadonlyVec2, SeededRandom, Vec2 } from '@graveshift/shared/core';
import {
  castRayAgainstMap,
  cellAt,
  CollisionLayer,
  FlowField,
  hasLineOfSight,
  rayCircleIntersection,
} from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import type { BotDecision } from './BotDecision.ts';
import { BotGoal } from './BotGoal.ts';
import type { BotSituation } from './BotSituation.ts';

const REVIVE_STOP_DISTANCE = 0.8;
const KITE_DISTANCE = 3.2;
const ENGAGE_DISTANCE = 9;
const THREAT_RADIUS = 5;
const AMBUSH_RADIUS = 5;
const PROBE_COUNT = 16;
const PROBE_DISTANCE = 1.2;
const MIN_CLEARANCE = 0.7;
const CLEARANCE_WEIGHT = 0.4;
const BLOCKED_PENALTY = 2;
const FLOW_REFRESH_DECISIONS = 5;
const STALL_CHECK_DECISIONS = 20;
const STALL_DISTANCE = 0.15;
const ESCAPE_DECISIONS = 12;
const RAY_SIDES: readonly number[] = [-1, 0, 1];
const REACTION_DECISIONS = 9;
const AIM_TURN_RADIANS_PER_SECOND = 5;
const AIM_ERROR_RADIANS = 0.09;
const AIM_ERROR_REFRESH_DECISIONS = 12;
const FIRE_CONE_RADIANS = 0.14;
const FRIENDLY_FIRE_MARGIN = 0.25;
const LEASH_DISTANCE = 4.5;
const BLIND_PATIENCE_DECISIONS = 90;
const ERRAND_STOP_DISTANCE = 1.5;

function identity(point: ReadonlyVec2): ReadonlyVec2 {
  return point;
}

function nearest(origin: ReadonlyVec2, points: readonly ReadonlyVec2[]): ReadonlyVec2 | null {
  return nearestTo(origin, points, identity);
}

export class BotPilot {
  private readonly map: TileMap;
  private readonly random: SeededRandom;
  private readonly flow: FlowField;
  private readonly probes: readonly Vec2[];
  private readonly flowDirection = vec2();
  private readonly rayOrigin = vec2();
  private readonly stallAnchor = vec2();
  private readonly escapeDirection = vec2();
  private readonly aimDirection = vec2();
  private flowGoal: BotGoal = BotGoal.Hold;
  private flowAge = 0;
  private decisions = 0;
  private escapeDecisionsLeft = 0;
  private aim = 0;
  private aimError = 0;
  private sightedDecisions = 0;
  private blindDecisions = 0;
  private lineBlocked = false;
  private strafeSide = 0;

  constructor(map: TileMap, random: SeededRandom) {
    this.map = map;
    this.random = random;
    this.flow = new FlowField(map);
    this.probes = Array.from({ length: PROBE_COUNT }, (_, index) =>
      directionFromAngle((index / PROBE_COUNT) * Math.PI * 2),
    );
  }

  decide(situation: BotSituation, decision: BotDecision): void {
    this.decisions += 1;
    const target = this.visibleTarget(situation);
    this.sightedDecisions = target === null ? 0 : this.sightedDecisions + 1;
    this.blindDecisions =
      target === null && situation.enemies.length > 0 ? this.blindDecisions + 1 : 0;
    decision.fire = target !== null && this.readyToFire(situation, target);
    decision.aim = this.aim;
    this.steer(situation, target, decision);
    this.recoverFromStall(situation.self, decision);
  }

  private readyToFire(situation: BotSituation, target: ReadonlyVec2): boolean {
    if (this.decisions % AIM_ERROR_REFRESH_DECISIONS === 0) {
      this.aimError = this.random.range(-AIM_ERROR_RADIANS, AIM_ERROR_RADIANS);
    }
    const desired = angleBetween(situation.self, target) + this.aimError;
    const maxTurn = AIM_TURN_RADIANS_PER_SECOND * SIMULATION.tickSeconds;
    const turn = wrapAngle(desired - this.aim);
    this.aim = wrapAngle(this.aim + Math.max(-maxTurn, Math.min(maxTurn, turn)));
    const settled = Math.abs(wrapAngle(desired - this.aim)) <= FIRE_CONE_RADIANS;
    this.lineBlocked = this.allyInLineOfFire(situation, distance(situation.self, target));
    return settled && this.sightedDecisions > REACTION_DECISIONS && !this.lineBlocked;
  }

  private allyInLineOfFire(situation: BotSituation, targetDistance: number): boolean {
    directionFromAngle(this.aim, this.aimDirection);
    return situation.allies.some((ally) => {
      const hit = rayCircleIntersection(
        situation.self,
        this.aimDirection,
        ally,
        PLAYER_RULES.radius + FRIENDLY_FIRE_MARGIN,
      );
      return hit !== null && hit < targetDistance;
    });
  }

  private steer(situation: BotSituation, target: ReadonlyVec2 | null, decision: BotDecision): void {
    const ally = nearest(situation.self, situation.downedAllies);
    if (ally !== null) {
      if (distance(situation.self, ally) <= REVIVE_STOP_DISTANCE) {
        this.hold(decision);
      } else {
        this.followFlow(BotGoal.Revive, situation.self, situation.downedAllies, ally, decision);
      }
      return;
    }
    if (target === null || !this.lineBlocked) {
      this.strafeSide = 0;
    }
    if (target !== null) {
      if (this.lineBlocked) {
        this.strafe(situation.self, target, decision);
      } else if (distance(situation.self, target) < KITE_DISTANCE) {
        this.kite(situation, decision);
      } else {
        this.hold(decision);
      }
      return;
    }
    const prey = nearest(situation.self, situation.enemies);
    if (prey !== null && this.blindDecisions > BLIND_PATIENCE_DECISIONS) {
      this.followFlow(BotGoal.Hunt, situation.self, situation.enemies, prey, decision);
      return;
    }
    if (
      situation.errand !== null &&
      distance(situation.self, situation.errand) > ERRAND_STOP_DISTANCE
    ) {
      this.followFlow(
        BotGoal.Errand,
        situation.self,
        [situation.errand],
        situation.errand,
        decision,
      );
      return;
    }
    if (situation.leader !== null) {
      if (distance(situation.self, situation.leader) > LEASH_DISTANCE) {
        this.followFlow(
          BotGoal.Follow,
          situation.self,
          [situation.leader],
          situation.leader,
          decision,
        );
      } else {
        this.hold(decision);
      }
      return;
    }
    if (prey === null || distance(situation.self, prey) < AMBUSH_RADIUS) {
      this.hold(decision);
      return;
    }
    this.followFlow(BotGoal.Hunt, situation.self, situation.enemies, prey, decision);
  }

  private visibleTarget(situation: BotSituation): ReadonlyVec2 | null {
    return nearestTo(situation.self, situation.enemies, identity, {
      maxDistance: ENGAGE_DISTANCE,
      accept: (enemy) =>
        hasLineOfSight(this.map, situation.self, enemy, CollisionLayer.Projectiles),
    });
  }

  private followFlow(
    goal: BotGoal,
    self: ReadonlyVec2,
    sources: readonly ReadonlyVec2[],
    fallback: ReadonlyVec2,
    decision: BotDecision,
  ): void {
    this.flowAge += 1;
    if (goal !== this.flowGoal || this.flowAge >= FLOW_REFRESH_DECISIONS) {
      this.flow.rebuild(sources.map(cellAt));
      this.flowGoal = goal;
      this.flowAge = 0;
    }
    const here = cellAt(self);
    const there = cellAt(fallback);
    const sameCell = here.cx === there.cx && here.cy === there.cy;
    if (sameCell || !this.flow.directionAt(self, this.flowDirection)) {
      directionTo(self, fallback, this.flowDirection);
    }
    this.move(decision, this.flowDirection.x, this.flowDirection.y);
  }

  private kite(situation: BotSituation, decision: BotDecision): void {
    let awayX = 0;
    let awayY = 0;
    for (const enemy of situation.enemies) {
      const squared = distanceSquared(situation.self, enemy);
      if (squared < THREAT_RADIUS * THREAT_RADIUS && squared > 1e-6) {
        awayX += (situation.self.x - enemy.x) / squared;
        awayY += (situation.self.y - enemy.y) / squared;
      }
    }
    const awayLength = Math.max(1e-6, Math.hypot(awayX, awayY));
    let best = this.probes[0];
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const probe of this.probes) {
      const clearance = this.clearance(situation.self, probe);
      const alignment = (probe.x * awayX + probe.y * awayY) / awayLength;
      const score =
        alignment +
        clearance * CLEARANCE_WEIGHT -
        (clearance < MIN_CLEARANCE ? BLOCKED_PENALTY : 0);
      if (score > bestScore) {
        best = probe;
        bestScore = score;
      }
    }
    if (best === undefined) {
      this.hold(decision);
      return;
    }
    this.move(decision, best.x, best.y);
  }

  private strafe(self: ReadonlyVec2, target: ReadonlyVec2, decision: BotDecision): void {
    const angle = angleBetween(self, target);
    if (this.strafeSide === 0) {
      const left = this.clearance(
        self,
        directionFromAngle(angle + Math.PI / 2, this.flowDirection),
      );
      const right = this.clearance(
        self,
        directionFromAngle(angle - Math.PI / 2, this.flowDirection),
      );
      this.strafeSide = left >= right ? 1 : -1;
    }
    const side = directionFromAngle(angle + (this.strafeSide * Math.PI) / 2, this.flowDirection);
    if (this.clearance(self, side) < MIN_CLEARANCE) {
      this.strafeSide = -this.strafeSide;
      directionFromAngle(angle + (this.strafeSide * Math.PI) / 2, side);
    }
    this.move(decision, side.x, side.y);
  }

  private recoverFromStall(self: ReadonlyVec2, decision: BotDecision): void {
    if (this.escapeDecisionsLeft > 0) {
      this.escapeDecisionsLeft -= 1;
      this.move(decision, this.escapeDirection.x, this.escapeDirection.y);
      return;
    }
    if (this.decisions % STALL_CHECK_DECISIONS !== 0) {
      return;
    }
    const wantsToMove = decision.moveX !== 0 || decision.moveY !== 0;
    const stalled = wantsToMove && distance(self, this.stallAnchor) < STALL_DISTANCE;
    this.stallAnchor.x = self.x;
    this.stallAnchor.y = self.y;
    if (stalled && this.pickEscape(self)) {
      this.escapeDecisionsLeft = ESCAPE_DECISIONS;
      this.move(decision, this.escapeDirection.x, this.escapeDirection.y);
    }
  }

  private pickEscape(self: ReadonlyVec2): boolean {
    const start = this.random.integer(0, PROBE_COUNT);
    for (let offset = 0; offset < PROBE_COUNT; offset += 1) {
      const probe = this.probes[(start + offset) % PROBE_COUNT];
      if (probe !== undefined && this.clearance(self, probe) >= MIN_CLEARANCE) {
        this.escapeDirection.x = probe.x;
        this.escapeDirection.y = probe.y;
        return true;
      }
    }
    return false;
  }

  private clearance(self: ReadonlyVec2, direction: ReadonlyVec2): number {
    let shortest = PROBE_DISTANCE;
    for (const side of RAY_SIDES) {
      this.rayOrigin.x = self.x - direction.y * PLAYER_RULES.radius * side;
      this.rayOrigin.y = self.y + direction.x * PLAYER_RULES.radius * side;
      shortest = Math.min(
        shortest,
        castRayAgainstMap(
          this.map,
          this.rayOrigin,
          direction,
          PROBE_DISTANCE,
          CollisionLayer.Movement,
        ),
      );
    }
    return shortest;
  }

  private move(decision: BotDecision, x: number, y: number): void {
    decision.moveX = x;
    decision.moveY = y;
  }

  private hold(decision: BotDecision): void {
    this.move(decision, 0, 0);
  }
}
