import { describe, expect, it } from 'vitest';
import { HeroId, HEROES, SIMULATION, WeaponId } from '@graveshift/shared/config';
import { flagSetOf } from '@graveshift/shared/core';
import { LifeState, MatchPhase, PlayerFlag } from '@graveshift/shared/model';
import type { PlayerFlag as PlayerFlagValue } from '@graveshift/shared/model';
import { ServerMessageType } from '@graveshift/shared/protocol';
import type { PlayerSnapshot, SnapshotMessage } from '@graveshift/shared/protocol';
import { stepPlayerMotion } from '@graveshift/shared/rules';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { LocalPlayerPredictor } from '../prediction/LocalPlayerPredictor.ts';
import { interpolateWorld } from '../view/interpolateWorld.ts';
import { ServerTickClock } from './ServerTickClock.ts';
import { SnapshotBuffer } from './SnapshotBuffer.ts';

const NO_FLAGS = flagSetOf<PlayerFlagValue>([]);
const RELOADING = flagSetOf([PlayerFlag.Reloading]);

const map = parseTileMap({
  id: MapId.Graveyard,
  rows: ['##########', '#P......S#', '#........#', '##########'],
});
const speed = HEROES[HeroId.Pippin].moveSpeed;

function snapshot(tick: number, x = 1.5): SnapshotMessage {
  return {
    type: ServerMessageType.Snapshot,
    tick,
    phase: MatchPhase.Combat,
    wave: 1,
    phaseTicksLeft: 0,
    enemiesRemaining: 0,
    players: [player(x, 0)],
    enemies: [],
    pickups: [],
    merchant: null,
    events: [],
  };
}

function player(x: number, lastInputSequence: number): PlayerSnapshot {
  return {
    id: 1,
    hero: HeroId.Pippin,
    x,
    y: 1.5,
    height: 0,
    verticalSpeed: 0,
    aim: 0,
    health: 100,
    maxHealth: 150,
    life: LifeState.Alive,
    weapon: WeaponId.Pistol,
    ammo: 12,
    melee: WeaponId.Shovel,
    meleeCharge: 0,
    furyProgress: 0,
    flags: NO_FLAGS,
    reloadProgress: 0,
    reviveProgress: 0,
    bleedoutProgress: 0,
    coins: 0,
    score: 0,
    kills: 0,
    deaths: 0,
    revives: 0,
    pingMilliseconds: 0,
    lastInputSequence,
  };
}

describe('SnapshotBuffer', () => {
  it('brackets render ticks and ignores out-of-order snapshots', () => {
    const buffer = new SnapshotBuffer();
    buffer.push(snapshot(10));
    buffer.push(snapshot(12));
    buffer.push(snapshot(11));
    const bracket = buffer.bracket(11);
    expect(bracket!.older.tick).toBe(10);
    expect(bracket!.newer.tick).toBe(12);
    expect(bracket!.alpha).toBeCloseTo(0.5);
    expect(buffer.bracket(20)!.alpha).toBe(1);
  });
});

describe('ServerTickClock', () => {
  it('renders behind the estimated server tick', () => {
    const clock = new ServerTickClock();
    clock.observe(100, 1000);
    const now = 1000 + SIMULATION.tickMilliseconds * 2;
    expect(clock.serverTickAt(now)).toBeCloseTo(102);
    expect(clock.renderTickAt(now)).toBeCloseTo(102 - SIMULATION.interpolationDelayTicks);
  });
});

describe('LocalPlayerPredictor', () => {
  it('replays unacknowledged inputs on top of the authoritative state', () => {
    const predictor = new LocalPlayerPredictor(map, speed, { x: 1.5, y: 1.5 });
    const intent = { moveX: 1, moveY: 0, jump: false };
    for (let sequence = 1; sequence <= 5; sequence += 1) {
      predictor.apply(sequence, intent);
    }
    const server = { position: { x: 1.5, y: 1.5 }, height: 0, verticalSpeed: 0 };
    for (let step = 0; step < 2; step += 1) {
      stepPlayerMotion(server, intent, speed, map);
    }
    predictor.reconcile(player(server.position.x, 2), false);
    const expected = { position: { x: 1.5, y: 1.5 }, height: 0, verticalSpeed: 0 };
    for (let step = 0; step < 5; step += 1) {
      stepPlayerMotion(expected, intent, speed, map);
    }
    expect(predictor.position.x).toBeCloseTo(expected.position.x, 6);
  });

  it('predicts a jump and agrees with the server mid-air', () => {
    const predictor = new LocalPlayerPredictor(map, speed, { x: 1.5, y: 1.5 });
    const inputs = [true, false, false, false, false, false].map((jump) => ({
      moveX: 1,
      moveY: 0,
      jump,
    }));
    inputs.forEach((intent, index) => {
      predictor.apply(index + 1, intent);
    });
    const server = { position: { x: 1.5, y: 1.5 }, height: 0, verticalSpeed: 0 };
    for (const intent of inputs.slice(0, 3)) {
      stepPlayerMotion(server, intent, speed, map);
    }
    const predictedHeight = predictor.height;
    predictor.reconcile(
      {
        ...player(server.position.x, 3),
        height: server.height,
        verticalSpeed: server.verticalSpeed,
      },
      false,
    );
    expect(predictedHeight).toBeGreaterThan(0);
    expect(predictor.height).toBe(predictedHeight);
  });

  it('snaps to the server while downed', () => {
    const predictor = new LocalPlayerPredictor(map, speed, { x: 1.5, y: 1.5 });
    predictor.apply(1, { moveX: 1, moveY: 0, jump: false });
    predictor.reconcile({ ...player(3, 0), life: LifeState.Downed }, false);
    predictor.apply(2, { moveX: 1, moveY: 0, jump: false });
    expect(predictor.position.x).toBe(3);
  });
});

describe('reload progress interpolation', () => {
  it('interpolates matching active reloads for both local and remote players', () => {
    const olderPlayer = { ...player(1.5, 0), flags: RELOADING, reloadProgress: 0.2 };
    const newerPlayer = { ...olderPlayer, reloadProgress: 0.8 };
    const bracket = {
      older: { ...snapshot(10), players: [olderPlayer] },
      newer: { ...snapshot(12), players: [newerPlayer] },
      alpha: 0.5,
    };
    const local = { id: 1, position: { x: 1.5, y: 1.5 }, height: 0, aim: 0, moving: false };
    expect(interpolateWorld(bracket, new Map(), null).players[0]!.reloadProgress).toBeCloseTo(0.5);
    expect(interpolateWorld(bracket, new Map(), local).players[0]!.reloadProgress).toBeCloseTo(0.5);
  });

  it('uses the latest progress at boundaries, resets, and weapon changes', () => {
    const active = { ...player(1.5, 0), flags: RELOADING, reloadProgress: 0.6 };
    const cases = [
      { older: { ...active, flags: NO_FLAGS, reloadProgress: 0 }, newer: active },
      { older: active, newer: { ...active, flags: NO_FLAGS, reloadProgress: 0 } },
      { older: active, newer: { ...active, weapon: WeaponId.Rifle, reloadProgress: 0.8 } },
      { older: active, newer: { ...active, reloadProgress: 0.1 } },
    ];
    for (const entry of cases) {
      const bracket = {
        older: { ...snapshot(10), players: [entry.older] },
        newer: { ...snapshot(12), players: [entry.newer] },
        alpha: 0.5,
      };
      expect(interpolateWorld(bracket, new Map(), null).players[0]!.reloadProgress).toBe(
        entry.newer.reloadProgress,
      );
    }
    const latest = { ...snapshot(12), players: [active] };
    const missing = { older: { ...snapshot(10), players: [] }, newer: latest, alpha: 0.5 };
    expect(interpolateWorld(missing, new Map(), null).players[0]!.reloadProgress).toBe(0.6);
    expect(
      interpolateWorld({ older: latest, newer: latest, alpha: 1 }, new Map(), null).players[0]!
        .reloadProgress,
    ).toBe(0.6);
  });
});
