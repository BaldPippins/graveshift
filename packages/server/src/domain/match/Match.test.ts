import { describe, expect, it } from 'vitest';
import {
  ENEMIES,
  HeroId,
  PICKUPS,
  PickupKind,
  ROOM_RULES,
  SIMULATION,
  WAVE_RULES,
  WeaponId,
} from '@graveshift/shared/config';
import { InputButton, LifeState, MatchOutcome, MatchPhase } from '@graveshift/shared/model';
import { ClientMessageType, GameEventType } from '@graveshift/shared/protocol';
import type { PlayerInputMessage, SnapshotMessage } from '@graveshift/shared/protocol';
import {
  matchScore,
  motionClearance,
  PurchaseRejection,
  ShopOfferKind,
} from '@graveshift/shared/rules';
import {
  CollisionLayer,
  MAP_DEFINITIONS,
  MapId,
  parseTileMap,
  resolveCircleAgainstMap,
  TileKind,
} from '@graveshift/shared/world';
import { Match } from './Match.ts';
import type { MatchStepResult } from './MatchStepResult.ts';

const PLAYER_ID = 1;
const BOT_ID = ROOM_RULES.firstBotPlayerId;

function input(
  sequence: number,
  moveX: number,
  moveY: number,
  aim: number,
  buttons: number,
): PlayerInputMessage {
  return { type: ClientMessageType.PlayerInput, sequence, viewTick: 0, moveX, moveY, aim, buttons };
}

function createMatch(): Match {
  return new Match(
    [{ id: PLAYER_ID, nickname: 'Tester', hero: HeroId.Watchman, isBot: false }],
    MapId.Graveyard,
    42,
  );
}

function createMatchWithBot(): Match {
  return new Match(
    [
      { id: PLAYER_ID, nickname: 'Tester', hero: HeroId.Watchman, isBot: false },
      { id: BOT_ID, nickname: 'Фрося', hero: HeroId.Lamplighter, isBot: true },
    ],
    MapId.Graveyard,
    7,
  );
}

function stepUntil(
  match: Match,
  predicate: (result: MatchStepResult) => boolean,
  maxTicks: number,
): MatchStepResult {
  for (let tick = 0; tick < maxTicks; tick += 1) {
    const result = match.step();
    if (predicate(result)) {
      return result;
    }
  }
  throw new Error(`Condition not reached within ${maxTicks} ticks`);
}

function localPlayer(snapshot: SnapshotMessage): SnapshotMessage['players'][number] {
  const player = snapshot.players.find((candidate) => candidate.id === PLAYER_ID);
  if (player === undefined) {
    throw new Error('Player missing from snapshot');
  }
  return player;
}

describe('Match', () => {
  it('moves players by their inputs and acknowledges sequences', () => {
    const match = createMatch();
    const start = localPlayer(match.step().snapshot);
    match.enqueueInput(PLAYER_ID, input(1, 1, 0, 0, 0));
    match.enqueueInput(PLAYER_ID, input(2, 1, 0, 0, 0));
    const moved = localPlayer(match.step().snapshot);
    expect(moved.x).toBeGreaterThan(start.x);
    expect(moved.lastInputSequence).toBe(2);
  });

  it('ignores stale and duplicate inputs', () => {
    const match = createMatch();
    match.enqueueInput(PLAYER_ID, input(5, 1, 0, 0, 0));
    match.step();
    const before = localPlayer(match.step().snapshot);
    match.enqueueInput(PLAYER_ID, input(5, 1, 0, 0, 0));
    match.enqueueInput(PLAYER_ID, input(3, 1, 0, 0, 0));
    const after = localPlayer(match.step().snapshot);
    expect(after.x).toBe(before.x);
  });

  it('starts wave one after the countdown and fires shots', () => {
    const match = createMatch();
    const countdownTicks = WAVE_RULES.countdownSeconds * SIMULATION.tickRate;
    const combat = stepUntil(
      match,
      (result) => result.snapshot.phase === MatchPhase.Combat,
      countdownTicks + 2,
    );
    expect(combat.snapshot.wave).toBe(1);
    expect(combat.snapshot.events.some((event) => event.type === GameEventType.WaveStarted)).toBe(
      true,
    );

    match.enqueueInput(PLAYER_ID, input(1, 0, 0, 0, InputButton.Fire));
    const fired = stepUntil(
      match,
      (result) => result.snapshot.events.some((event) => event.type === GameEventType.ShotFired),
      3,
    );
    expect(localPlayer(fired.snapshot).ammo).toBeLessThan(12);
  });

  it('sells only to players standing next to the merchant', () => {
    const match = createMatch();
    match.step();
    const offer = { kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Smg } as const;
    expect(match.purchase(PLAYER_ID, offer)).toBe(PurchaseRejection.MerchantTooFar);
    for (let sequence = 1; sequence <= 12; sequence += 1) {
      match.enqueueInput(PLAYER_ID, input(sequence, 1, 0, 0, 0));
      match.step();
    }
    expect(match.purchase(PLAYER_ID, offer)).toBe(PurchaseRejection.NotEnoughCoins);
  });

  it('ends in defeat when the only player stands still long enough', () => {
    const match = createMatch();
    const ended = stepUntil(match, (result) => result.summary !== null, SIMULATION.tickRate * 600);
    expect(ended.summary!.outcome).toBe(MatchOutcome.Defeat);
    expect(ended.summary!.stats[0]!.downs).toBe(1);
    expect(localPlayer(ended.snapshot).life).toBe(LifeState.Downed);
  });

  it('grows pumpkins on every patch', () => {
    const patches = parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]).cellsOfKind(
      TileKind.PumpkinPatch,
    );
    const pumpkins = createMatch()
      .step()
      .snapshot.pickups.filter((pickup) => pickup.kind === PickupKind.Pumpkin);
    expect(pumpkins).toHaveLength(patches.length);
    expect(PICKUPS[PickupKind.Pumpkin].lifetimeSeconds).toBe(Number.POSITIVE_INFINITY);
  });

  it('keeps pumpkins through the intermission', () => {
    const match = createMatchWithBot();
    const pumpkinsAtStart = match
      .step()
      .snapshot.pickups.filter((pickup) => pickup.kind === PickupKind.Pumpkin).length;
    const intermission = stepUntil(
      match,
      (result) => result.snapshot.phase === MatchPhase.Intermission,
      SIMULATION.tickRate * 600,
    );
    const pumpkins = intermission.snapshot.pickups.filter(
      (pickup) => pickup.kind === PickupKind.Pumpkin,
    );
    expect(pumpkins.length).toBeGreaterThan(0);
    expect(pumpkins.length).toBeLessThanOrEqual(pumpkinsAtStart);
  });

  it('publishes scoreboard changes only when displayed values change', () => {
    const match = createMatchWithBot();
    expect(match.scoreboard()).toHaveLength(2);
    expect(match.step().scoreboardChanges).toEqual([]);
    const changed = stepUntil(match, (result) => result.scoreboardChanges.length > 0, 1800);
    for (const entry of changed.scoreboardChanges) {
      expect(match.scoreboard()).toContainEqual(entry);
    }
    expect(match.step().scoreboardChanges).toEqual([]);
  });

  it('lets bots fight on their own and keeps the match while a human stays', () => {
    const match = createMatchWithBot();
    stepUntil(
      match,
      (result) =>
        result.snapshot.events.some(
          (event) => event.type === GameEventType.EnemyKilled && event.killerId === BOT_ID,
        ),
      SIMULATION.tickRate * 60,
    );
    match.removePlayer(PLAYER_ID);
    const result = match.step();
    expect(result.summary!.outcome).toBe(MatchOutcome.Abandoned);
    const bot = match.scoreboard().find((player) => player.playerId === BOT_ID)!;
    const stats = result.summary!.stats.find((player) => player.playerId === BOT_ID)!;
    expect(bot.score).toBeGreaterThan(0);
    expect(bot.score).toBe(matchScore(stats));
    expect(bot.kills).toBe(stats.kills);
    expect(bot.deaths).toBe(stats.deaths);
    expect(bot.revives).toBe(stats.revives);
  });

  it('lets bots hop off the ground on their own', () => {
    const match = createMatchWithBot();
    stepUntil(
      match,
      (result) =>
        result.snapshot.players.some((player) => player.id === BOT_ID && player.height > 0),
      SIMULATION.tickRate * 90,
    );
  });

  it('never lets solid enemies or players sink into obstacles', () => {
    const map = parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]);
    const match = createMatchWithBot();
    let checkedSolidEnemies = 0;
    for (let tick = 0; tick < SIMULATION.tickRate * 240; tick += 1) {
      const { snapshot } = match.step();
      for (const enemy of snapshot.enemies) {
        const definition = ENEMIES[enemy.kind];
        if (definition.phasesThroughWalls) {
          continue;
        }
        const resolved = { x: enemy.x, y: enemy.y };
        resolveCircleAgainstMap(resolved, definition.radius, map, CollisionLayer.Movement);
        expect(Math.hypot(resolved.x - enemy.x, resolved.y - enemy.y)).toBeLessThan(1e-6);
        checkedSolidEnemies += 1;
      }
      for (const player of snapshot.players) {
        expect(
          map.isBlockedAbove(
            Math.floor(player.x),
            Math.floor(player.y),
            CollisionLayer.Movement,
            motionClearance(player.height),
          ),
        ).toBe(false);
      }
    }
    expect(checkedSolidEnemies).toBeGreaterThan(1000);
  });

  it('lets players wound each other with friendly fire', () => {
    const allyId = PLAYER_ID + 1;
    const match = new Match(
      [
        { id: PLAYER_ID, nickname: 'Tester', hero: HeroId.Watchman, isBot: false },
        { id: allyId, nickname: 'Ally', hero: HeroId.Pippin, isBot: false },
      ],
      MapId.Graveyard,
      3,
    );
    const start = match.step().snapshot;
    const shooter = localPlayer(start);
    const ally = start.players.find((player) => player.id === allyId);
    if (ally === undefined) {
      throw new Error('Ally missing');
    }
    const aim = Math.atan2(ally.y - shooter.y, ally.x - shooter.x);
    match.enqueueInput(PLAYER_ID, input(1, 0, 0, aim, InputButton.Fire));
    const wounded = stepUntil(
      match,
      (result) =>
        result.snapshot.events.some(
          (event) =>
            event.type === GameEventType.PlayerDamaged &&
            event.playerId === allyId &&
            event.attackerId === PLAYER_ID,
        ),
      5,
    );
    expect(wounded.snapshot.players.find((player) => player.id === allyId)!.health).toBeLessThan(
      ally.health,
    );
  });

  it('stops shots at allies without damage when friendly fire is disabled', () => {
    const allyId = PLAYER_ID + 1;
    const match = new Match(
      [
        { id: PLAYER_ID, nickname: 'Tester', hero: HeroId.Watchman, isBot: false },
        { id: allyId, nickname: 'Ally', hero: HeroId.Pippin, isBot: false },
      ],
      MapId.Graveyard,
      3,
      { totalWaves: 15, friendlyFire: false },
    );
    const start = match.step().snapshot;
    const shooter = localPlayer(start);
    const ally = start.players.find((player) => player.id === allyId);
    if (ally === undefined) {
      throw new Error('Ally missing');
    }
    const aim = Math.atan2(ally.y - shooter.y, ally.x - shooter.x);
    match.enqueueInput(PLAYER_ID, input(1, 0, 0, aim, InputButton.Fire));
    const fired = stepUntil(
      match,
      (result) => result.snapshot.events.some((event) => event.type === GameEventType.ShotFired),
      SIMULATION.tickRate * 2,
    );
    const shot = fired.snapshot.events.find((event) => event.type === GameEventType.ShotFired);
    if (shot === undefined) {
      throw new Error('Shot missing');
    }
    expect(fired.snapshot.players.find((player) => player.id === allyId)!.health).toBe(ally.health);
    expect(fired.snapshot.events.some((event) => event.type === GameEventType.PlayerDamaged)).toBe(
      false,
    );
    expect(Math.hypot(shot.toX - ally.x, shot.toY - ally.y)).toBeLessThan(1);
  });

  it('lets players shoot the merchant', () => {
    const match = createMatch();
    match.step();
    match.enqueueInput(PLAYER_ID, input(1, 0, 0, 0, InputButton.Fire));
    const shot = stepUntil(match, (result) => result.snapshot.merchant!.healthFraction < 1, 10);
    expect(shot.snapshot.merchant!.wavesUntilReturn).toBe(0);
  });

  it('is abandoned when every player leaves', () => {
    const match = createMatch();
    match.removePlayer(PLAYER_ID);
    expect(match.step().summary!.outcome).toBe(MatchOutcome.Abandoned);
  });
});
