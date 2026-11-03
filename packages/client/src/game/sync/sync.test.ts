import { describe, expect, it } from 'vitest';
import { HeroId, HEROES, SIMULATION, WeaponId } from '@graveshift/shared/config';
import { LifeState, MatchPhase } from '@graveshift/shared/model';
import { ServerMessageType } from '@graveshift/shared/protocol';
import type { PlayerSnapshot, SnapshotMessage } from '@graveshift/shared/protocol';
import { stepPlayerMovement } from '@graveshift/shared/rules';
import { MapId, parseTileMap } from '@graveshift/shared/world';
import { LocalPlayerPredictor } from '../prediction/LocalPlayerPredictor.ts';
import { ServerTickClock } from './ServerTickClock.ts';
import { SnapshotBuffer } from './SnapshotBuffer.ts';

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
    aim: 0,
    health: 100,
    maxHealth: 150,
    life: LifeState.Alive,
    weapon: WeaponId.Pistol,
    ammo: 12,
    flags: 0,
    reviveProgress: 0,
    bleedoutProgress: 0,
    coins: 0,
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
    const intent = { moveX: 1, moveY: 0 };
    for (let sequence = 1; sequence <= 5; sequence += 1) {
      predictor.apply(sequence, intent);
    }
    const server = { x: 1.5, y: 1.5 };
    for (let step = 0; step < 2; step += 1) {
      stepPlayerMovement(server, intent, speed, map);
    }
    predictor.reconcile(player(server.x, 2), false);
    const expected = { x: 1.5, y: 1.5 };
    for (let step = 0; step < 5; step += 1) {
      stepPlayerMovement(expected, intent, speed, map);
    }
    expect(predictor.position.x).toBeCloseTo(expected.x, 6);
  });

  it('snaps to the server while downed', () => {
    const predictor = new LocalPlayerPredictor(map, speed, { x: 1.5, y: 1.5 });
    predictor.apply(1, { moveX: 1, moveY: 0 });
    predictor.reconcile({ ...player(3, 0), life: LifeState.Downed }, false);
    predictor.apply(2, { moveX: 1, moveY: 0 });
    expect(predictor.position.x).toBe(3);
  });
});
