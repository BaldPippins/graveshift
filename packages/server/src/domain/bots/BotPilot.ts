import {
  MERCHANT_RULES,
  PLAYER_RULES,
  SIMULATION,
  TRAPS,
  TrapKind,
} from '@graveshift/shared/config';
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
import { isInsideMeleeSweep } from '@graveshift/shared/rules';
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
import { rollBotTemperament, swayedSector } from './BotTemperament.ts';
import type { BotTemperament } from './BotTemperament.ts';
import { CoinSeeker } from './CoinSeeker.ts';

const REVIVE_STOP_DISTANCE = 0.8;
const KITE_DISTANCE = 3.2;
const KITE_RELEASE_DISTANCE = 4.4;
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
const KEG_CLEARANCE = TRAPS[TrapKind.PowderKeg].radius + FRIENDLY_FIRE_MARGIN;
const BLIND_PATIENCE_DECISIONS = 90;
const SPOT_ARRIVAL_DISTANCE = 0.9;
const SPOT_LEAVE_DISTANCE = 1.7;
const STEERING_RESPONSE = 0.35;
const STEERING_DEADZONE = 0.05;
const SPOT_SHRINK_STEPS = 3;
const ERRAND_SPOT_RADIUS = 1.2;
const HUNT_HEADING_WEIGHT = 1.5;
const SEPARATION_RADIUS = 1.4;
const SEPARATION_WEIGHT = 1.2;
const HEAL_SEEK_HEALTH_FRACTION = 0.5;
const HEAL_SEEK_RADIUS = 12;
const SWING_TARGET_RADIUS = 0.2;
const WANDER_RADIUS = 7;
const WANDER_SPOT_ATTEMPTS = 12;
const WANDER_PACE = 0.55;
const WANDER_GIVE_UP_DECISIONS = 30 * 10;
const LOITER_MIN_DECISIONS = 30 * 2;
const LOITER_MAX_DECISIONS = 30 * 6;
const IDLE_JUMPS_PER_SECOND = 0.12;
const COMBAT_JUMPS_PER_SECOND = 0.25;
const JUMP_MIN_PACE = 0.3;

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
  private readonly apartDirection = vec2();
  private readonly spot = vec2();
  private readonly steering = vec2();
  private readonly wanderSpot = vec2();
  private readonly temperament: BotTemperament;
  private readonly coinSeeker: CoinSeeker;
  private intent: BotGoal = BotGoal.Hold;
  private sector = 0;
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
  private kiting = false;
  private settledGoal: BotGoal | null = null;
  private previouslySettledGoal: BotGoal | null = null;
  private hasWanderSpot = false;
  private wanderDecisions = 0;
  private loiterDecisionsLeft = 0;
  private hopOverObstacle = false;

  constructor(map: TileMap, random: SeededRandom, seat: number) {
    this.map = map;
    this.random = random;
    this.flow = new FlowField(map);
    this.temperament = rollBotTemperament(random, seat);
    this.coinSeeker = new CoinSeeker(random, this.temperament.greed);
    this.probes = Array.from({ length: PROBE_COUNT }, (_, index) =>
      directionFromAngle((index / PROBE_COUNT) * Math.PI * 2),
    );
  }

  decide(situation: BotSituation, decision: BotDecision): void {
    this.decisions += 1;
    this.intent = BotGoal.Hold;
    this.previouslySettledGoal = this.settledGoal;
    this.settledGoal = null;
    this.sector = swayedSector(this.temperament, this.decisions);
    const target = this.visibleTarget(situation);
    this.sightedDecisions = target === null ? 0 : this.sightedDecisions + 1;
    this.blindDecisions =
      target === null && situation.enemies.length > 0 ? this.blindDecisions + 1 : 0;
    const aimed = target !== null && this.readyToFire(situation, target);
    decision.fire = situation.hasRangedWeapon && aimed;
    decision.swing = target !== null && this.safeToSwing(situation);
    decision.aim = this.aim;
    this.steer(situation, target, decision);
    this.keepApart(situation, decision);
    this.recoverFromStall(situation.self, decision);
    this.smoothSteering(decision);
    decision.jump = this.wantsToJump(situation, decision);
  }

  private wantsToJump(situation: BotSituation, decision: BotDecision): boolean {
    if (this.hopOverObstacle) {
      this.hopOverObstacle = false;
      return true;
    }
    if (Math.hypot(decision.moveX, decision.moveY) < JUMP_MIN_PACE) {
      return false;
    }
    const jumpsPerSecond = situation.idle ? IDLE_JUMPS_PER_SECOND : COMBAT_JUMPS_PER_SECOND;
    return this.random.chance(jumpsPerSecond * this.temperament.jumpiness * SIMULATION.tickSeconds);
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
    this.lineBlocked = this.lineOfFireBlocked(situation, distance(situation.self, target));
    return settled && this.sightedDecisions > REACTION_DECISIONS && !this.lineBlocked;
  }

  private safeToSwing(situation: BotSituation): boolean {
    const sweep = {
      origin: situation.self,
      aim: this.aim,
      reach: situation.meleeReach,
      arcRadians: situation.meleeArcRadians,
    };
    return (
      situation.meleeTargets.some((enemy) =>
        isInsideMeleeSweep(sweep, enemy, SWING_TARGET_RADIUS),
      ) &&
      !situation.swingBlockers.some((ally) =>
        isInsideMeleeSweep(sweep, ally, MERCHANT_RULES.radius + FRIENDLY_FIRE_MARGIN),
      ) &&
      !situation.idleKegs.some((keg) => isInsideMeleeSweep(sweep, keg, KEG_CLEARANCE))
    );
  }

  private lineOfFireBlocked(situation: BotSituation, targetDistance: number): boolean {
    directionFromAngle(this.aim, this.aimDirection);
    const crosses = (point: ReadonlyVec2, radius: number): boolean => {
      const hit = rayCircleIntersection(situation.self, this.aimDirection, point, radius);
      return hit !== null && hit < targetDistance;
    };
    return (
      situation.allies.some((ally) => crosses(ally, PLAYER_RULES.radius + FRIENDLY_FIRE_MARGIN)) ||
      situation.idleKegs.some((keg) => crosses(keg, KEG_CLEARANCE))
    );
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
    const heal = this.reachableHeal(situation);
    if (heal !== null) {
      this.followFlow(BotGoal.Heal, situation.self, [heal], heal, decision);
      return;
    }
    if (target === null || !this.lineBlocked) {
      this.strafeSide = 0;
    }
    this.kiting = target !== null && this.isTooClose(situation.self, target);
    if (target !== null) {
      if (!situation.hasRangedWeapon) {
        if (distance(situation.self, target) > situation.meleeReach * 0.8) {
          this.followFlow(BotGoal.Hunt, situation.self, [target], target, decision);
        } else {
          this.hold(decision);
        }
        return;
      }
      if (this.lineBlocked) {
        this.strafe(situation.self, target, decision);
      } else if (this.kiting) {
        this.kite(situation, decision);
      } else {
        this.hold(decision);
      }
      return;
    }
    const prey = this.chosenPrey(situation);
    if (prey !== null && this.blindDecisions > BLIND_PATIENCE_DECISIONS) {
      this.followFlow(BotGoal.Hunt, situation.self, [prey], prey, decision);
      return;
    }
    if (situation.errand !== null) {
      const spot = this.spotAround(situation.errand, ERRAND_SPOT_RADIUS);
      this.approach(BotGoal.Errand, situation.self, spot, decision);
      return;
    }
    if (situation.idle) {
      this.roam(situation, decision);
      return;
    }
    this.hasWanderSpot = false;
    if (situation.leader !== null) {
      const spot = this.spotAround(situation.leader, this.temperament.slotRadius);
      this.approach(BotGoal.Follow, situation.self, spot, decision);
      return;
    }
    const closest = nearest(situation.self, situation.enemies);
    if (prey === null || closest === null || distance(situation.self, closest) < AMBUSH_RADIUS) {
      this.hold(decision);
      return;
    }
    this.followFlow(BotGoal.Hunt, situation.self, [prey], prey, decision);
  }

  private roam(situation: BotSituation, decision: BotDecision): void {
    const coin = this.coinSeeker.choose(situation.self, situation.coins);
    if (coin === null) {
      this.wander(situation.self, decision);
      return;
    }
    this.hasWanderSpot = false;
    this.loiterDecisionsLeft = 0;
    this.followFlow(BotGoal.Loot, situation.self, [coin], coin, decision);
  }

  private wander(self: ReadonlyVec2, decision: BotDecision): void {
    if (this.loiterDecisionsLeft > 0) {
      this.loiterDecisionsLeft -= 1;
      this.hold(decision);
      return;
    }
    if (!this.hasWanderSpot) {
      this.pickWanderSpot(self);
    }
    this.wanderDecisions += 1;
    const arrived = distance(self, this.wanderSpot) <= SPOT_ARRIVAL_DISTANCE;
    if (arrived || this.wanderDecisions > WANDER_GIVE_UP_DECISIONS) {
      this.hasWanderSpot = false;
      this.loiterDecisionsLeft = this.random.integer(LOITER_MIN_DECISIONS, LOITER_MAX_DECISIONS);
      this.hold(decision);
      return;
    }
    this.followFlow(BotGoal.Wander, self, [this.wanderSpot], this.wanderSpot, decision);
    decision.moveX *= WANDER_PACE;
    decision.moveY *= WANDER_PACE;
  }

  private pickWanderSpot(self: ReadonlyVec2): void {
    this.hasWanderSpot = true;
    this.wanderDecisions = 0;
    this.wanderSpot.x = self.x;
    this.wanderSpot.y = self.y;
    for (let attempt = 0; attempt < WANDER_SPOT_ATTEMPTS; attempt += 1) {
      const cx = Math.floor(self.x + this.random.range(-WANDER_RADIUS, WANDER_RADIUS));
      const cy = Math.floor(self.y + this.random.range(-WANDER_RADIUS, WANDER_RADIUS));
      if (this.map.isInside(cx, cy) && !this.map.isBlocked(cx, cy, CollisionLayer.Movement)) {
        this.wanderSpot.x = cx + 0.5;
        this.wanderSpot.y = cy + 0.5;
        return;
      }
    }
  }

  private isTooClose(self: ReadonlyVec2, target: ReadonlyVec2): boolean {
    return distance(self, target) < (this.kiting ? KITE_RELEASE_DISTANCE : KITE_DISTANCE);
  }

  private chosenPrey(situation: BotSituation): ReadonlyVec2 | null {
    let best: ReadonlyVec2 | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const enemy of situation.enemies) {
      const heading = angleBetween(situation.self, enemy) - this.sector;
      const offHeading = (1 - Math.cos(heading)) / 2;
      const score = distance(situation.self, enemy) * (1 + HUNT_HEADING_WEIGHT * offHeading);
      if (score < bestScore) {
        best = enemy;
        bestScore = score;
      }
    }
    return best;
  }

  private spotAround(center: ReadonlyVec2, radius: number): ReadonlyVec2 {
    for (let step = 0; step < SPOT_SHRINK_STEPS; step += 1) {
      const reach = radius * (1 - step / SPOT_SHRINK_STEPS);
      this.spot.x = center.x + Math.cos(this.sector) * reach;
      this.spot.y = center.y + Math.sin(this.sector) * reach;
      if (this.isOpenSpot(center, this.spot)) {
        return this.spot;
      }
    }
    return center;
  }

  private isOpenSpot(center: ReadonlyVec2, spot: ReadonlyVec2): boolean {
    const cell = cellAt(spot);
    return (
      !this.map.isBlocked(cell.cx, cell.cy, CollisionLayer.Movement) &&
      hasLineOfSight(this.map, center, spot, CollisionLayer.Movement)
    );
  }

  private approach(
    goal: BotGoal,
    self: ReadonlyVec2,
    spot: ReadonlyVec2,
    decision: BotDecision,
  ): void {
    const reach = this.previouslySettledGoal === goal ? SPOT_LEAVE_DISTANCE : SPOT_ARRIVAL_DISTANCE;
    if (distance(self, spot) > reach) {
      this.followFlow(goal, self, [spot], spot, decision);
      return;
    }
    this.settledGoal = goal;
    this.hold(decision);
  }

  private reachableHeal(situation: BotSituation): ReadonlyVec2 | null {
    if (situation.healthFraction >= HEAL_SEEK_HEALTH_FRACTION) {
      return null;
    }
    return nearestTo(situation.self, situation.heals, identity, { maxDistance: HEAL_SEEK_RADIUS });
  }

  private visibleTarget(situation: BotSituation): ReadonlyVec2 | null {
    const enemies = situation.hasRangedWeapon ? situation.enemies : situation.meleeTargets;
    return nearestTo(situation.self, enemies, identity, {
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
    this.intent = goal;
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

  private keepApart(situation: BotSituation, decision: BotDecision): void {
    if (!this.isFreeToSpread()) {
      return;
    }
    let pushX = 0;
    let pushY = 0;
    for (const ally of situation.allies) {
      const gap = distance(situation.self, ally);
      if (gap < SEPARATION_RADIUS && gap > 1e-6) {
        const strength = (SEPARATION_RADIUS - gap) / (SEPARATION_RADIUS * gap);
        pushX += (situation.self.x - ally.x) * strength;
        pushY += (situation.self.y - ally.y) * strength;
      }
    }
    const x = decision.moveX + pushX * SEPARATION_WEIGHT;
    const y = decision.moveY + pushY * SEPARATION_WEIGHT;
    const length = Math.hypot(x, y);
    if ((pushX === 0 && pushY === 0) || length < 1e-6) {
      return;
    }
    this.apartDirection.x = x / length;
    this.apartDirection.y = y / length;
    if (this.clearance(situation.self, this.apartDirection) >= MIN_CLEARANCE) {
      this.move(decision, this.apartDirection.x, this.apartDirection.y);
    }
  }

  private isFreeToSpread(): boolean {
    return (
      this.intent !== BotGoal.Revive &&
      this.intent !== BotGoal.Heal &&
      this.intent !== BotGoal.Errand
    );
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
    this.hopOverObstacle = stalled;
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

  private smoothSteering(decision: BotDecision): void {
    this.steering.x += (decision.moveX - this.steering.x) * STEERING_RESPONSE;
    this.steering.y += (decision.moveY - this.steering.y) * STEERING_RESPONSE;
    if (Math.hypot(this.steering.x, this.steering.y) < STEERING_DEADZONE) {
      this.steering.x = 0;
      this.steering.y = 0;
    }
    this.move(decision, this.steering.x, this.steering.y);
  }

  private move(decision: BotDecision, x: number, y: number): void {
    decision.moveX = x;
    decision.moveY = y;
  }

  private hold(decision: BotDecision): void {
    this.move(decision, 0, 0);
  }
}
