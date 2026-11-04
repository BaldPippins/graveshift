import { HEROES, SIMULATION } from '@graveshift/shared/config';
import { InputButton, LifeState } from '@graveshift/shared/model';
import { ClientMessageType, roundTripAngle, roundTripAxis } from '@graveshift/shared/protocol';
import type {
  ClientMessage,
  GameEvent,
  PlayerSnapshot,
  SnapshotMessage,
} from '@graveshift/shared/protocol';
import { isMerchantPresent, MerchantStall } from '@graveshift/shared/rules';
import { tileMapOf } from '@graveshift/shared/world';
import type { MapId, TileMap } from '@graveshift/shared/world';
import type { InputController } from '../input/InputController.ts';
import type { InputFrame } from '../input/InputFrame.ts';
import { TargetAimAssist } from './aim/TargetAimAssist.ts';
import { LocalPlayerPredictor } from './prediction/LocalPlayerPredictor.ts';
import { ServerTickClock } from './sync/ServerTickClock.ts';
import { SnapshotBuffer } from './sync/SnapshotBuffer.ts';
import type { TimedEvent } from './sync/TimedEvent.ts';
import { interpolateWorld } from './view/interpolateWorld.ts';
import type { LocalPlayerOverride } from './view/interpolateWorld.ts';
import type { WorldFrame } from './view/WorldFrame.ts';

const MAX_INPUT_STEPS_PER_FRAME = 4;
const MOVING_INPUT_THRESHOLD = 0.05;
const ORIGIN = { x: 0, y: 0 } as const;

export interface ClientMatchOptions {
  readonly localPlayerId: number;
  readonly mapId: MapId;
  readonly nicknames: ReadonlyMap<number, string>;
  readonly send: (message: ClientMessage) => void;
  readonly onEvent: (event: GameEvent) => void;
}

function buttonsOf(frame: InputFrame): number {
  return (
    (frame.fire ? InputButton.Fire : 0) |
    (frame.reload ? InputButton.Reload : 0) |
    (frame.melee ? InputButton.Melee : 0) |
    (frame.jump ? InputButton.Jump : 0)
  );
}

export class ClientMatch {
  readonly map: TileMap;
  private readonly options: ClientMatchOptions;
  private readonly input: InputController;
  private readonly clock = new ServerTickClock();
  private readonly snapshots = new SnapshotBuffer();
  private readonly pendingEvents: TimedEvent[] = [];
  private readonly aimAssist: TargetAimAssist;
  private readonly merchantStall: MerchantStall;
  private predictor: LocalPlayerPredictor | null = null;
  private inputAccumulatorSeconds = 0;
  private sequence = 0;
  private aim = 0;
  private lastMoveMagnitude = 0;
  private paused = false;

  constructor(options: ClientMatchOptions, input: InputController) {
    this.options = options;
    this.input = input;
    this.map = tileMapOf(options.mapId);
    this.aimAssist = new TargetAimAssist(this.map);
    this.merchantStall = new MerchantStall(this.map);
  }

  get latestSnapshot(): SnapshotMessage | undefined {
    return this.snapshots.latest;
  }

  get localPlayer(): PlayerSnapshot | undefined {
    const latest = this.snapshots.latest;
    return latest === undefined
      ? undefined
      : latest.players.find((player) => player.id === this.options.localPlayerId);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    this.input.setEnabled(!paused);
  }

  onSnapshot(snapshot: SnapshotMessage, receivedAtMilliseconds: number): void {
    this.clock.observe(snapshot.tick, receivedAtMilliseconds);
    this.snapshots.push(snapshot);
    this.merchantStall.setMerchantPresent(isMerchantPresent(snapshot.merchant));
    for (const event of snapshot.events) {
      this.pendingEvents.push({ tick: snapshot.tick, event });
    }
    const own = snapshot.players.find((player) => player.id === this.options.localPlayerId);
    if (own === undefined) {
      return;
    }
    this.predictor ??= new LocalPlayerPredictor(this.map, HEROES[own.hero].moveSpeed, own);
    this.predictor.reconcile(own, this.paused);
  }

  update(nowMilliseconds: number, deltaSeconds: number): WorldFrame | null {
    if (!this.clock.isSynchronized) {
      return null;
    }
    const renderTick = this.clock.renderTickAt(nowMilliseconds);
    this.sampleInputs(deltaSeconds, renderTick);
    if (this.predictor !== null) {
      this.predictor.updateVisual(
        deltaSeconds,
        this.inputAccumulatorSeconds / SIMULATION.tickSeconds,
      );
    }
    this.releaseEvents(renderTick);
    const bracket = this.snapshots.bracket(renderTick);
    if (bracket === undefined) {
      return null;
    }
    const frame = interpolateWorld(bracket, this.options.nicknames, this.localOverride());
    this.aimAssist.setTargets(frame.enemies);
    return frame;
  }

  private localOverride(): LocalPlayerOverride | null {
    if (this.predictor === null) {
      return null;
    }
    const own = this.localPlayer;
    const alive = own !== undefined && own.life === LifeState.Alive;
    return {
      id: this.options.localPlayerId,
      position: this.predictor.renderPosition,
      height: this.predictor.renderHeight,
      aim: alive || own === undefined ? this.aim : own.aim,
      moving: alive && !this.paused && this.lastMoveMagnitude > MOVING_INPUT_THRESHOLD,
    };
  }

  private sampleInputs(deltaSeconds: number, renderTick: number): void {
    this.inputAccumulatorSeconds = Math.min(
      this.inputAccumulatorSeconds + deltaSeconds,
      SIMULATION.tickSeconds * MAX_INPUT_STEPS_PER_FRAME,
    );
    while (this.inputAccumulatorSeconds >= SIMULATION.tickSeconds) {
      this.inputAccumulatorSeconds -= SIMULATION.tickSeconds;
      this.sendInput(Math.max(0, Math.floor(renderTick)));
    }
  }

  private sendInput(viewTick: number): void {
    const origin = this.predictor === null ? ORIGIN : this.predictor.position;
    const frame = this.input.sample({
      playerX: origin.x,
      playerY: origin.y,
      previousAim: this.aim,
      aimAssist: this.aimAssist,
    });
    const intent = {
      moveX: roundTripAxis(frame.moveX),
      moveY: roundTripAxis(frame.moveY),
      jump: frame.jump,
    };
    this.aim = roundTripAngle(frame.aim);
    this.lastMoveMagnitude = Math.hypot(intent.moveX, intent.moveY);
    this.sequence += 1;
    this.options.send({
      type: ClientMessageType.PlayerInput,
      sequence: this.sequence,
      viewTick,
      moveX: intent.moveX,
      moveY: intent.moveY,
      aim: this.aim,
      buttons: buttonsOf(frame),
    });
    if (this.predictor !== null) {
      this.predictor.apply(this.sequence, intent);
    }
  }

  private releaseEvents(renderTick: number): void {
    const firstFuture = this.pendingEvents.findIndex((timed) => timed.tick > renderTick);
    const released = firstFuture === -1 ? this.pendingEvents.length : firstFuture;
    for (const timed of this.pendingEvents.splice(0, released)) {
      this.options.onEvent(timed.event);
    }
  }
}
