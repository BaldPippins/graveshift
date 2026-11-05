import type {
  ClientMessage,
  GameEvent,
  ScoreboardEntry,
  SnapshotMessage,
} from '@graveshift/shared/protocol';
import type { MapId } from '@graveshift/shared/world';
import { ClientMatch } from '../game/ClientMatch.ts';
import type { WorldFrame } from '../game/view/WorldFrame.ts';
import type { AimResolver } from '../input/AimResolver.ts';
import type { InputCommands } from '../input/InputCommands.ts';
import { InputController } from '../input/InputController.ts';
import { KeyboardMouseInput } from '../input/KeyboardMouseInput.ts';
import { TouchInput } from '../input/touch/TouchInput.ts';

export interface GameSessionOptions {
  readonly localPlayerId: number;
  readonly mapId: MapId;
  readonly nicknames: ReadonlyMap<number, string>;
  readonly surface: HTMLElement;
  readonly aimResolver: AimResolver;
  readonly commands: InputCommands;
  readonly send: (message: ClientMessage) => void;
  readonly onEvent: (event: GameEvent) => void;
}

export class GameSession {
  readonly localPlayerId: number;
  readonly nicknames: ReadonlyMap<number, string>;
  readonly touch: TouchInput;
  readonly match: ClientMatch;
  readonly scoreboard = new Map<number, ScoreboardEntry>();
  private readonly input: InputController;

  constructor(options: GameSessionOptions) {
    this.localPlayerId = options.localPlayerId;
    this.nicknames = options.nicknames;
    this.touch = new TouchInput(options.surface);
    this.input = new InputController([
      this.touch,
      new KeyboardMouseInput(options.surface, options.aimResolver, options.commands),
    ]);
    this.match = new ClientMatch(
      {
        localPlayerId: options.localPlayerId,
        mapId: options.mapId,
        nicknames: options.nicknames,
        send: options.send,
        onEvent: options.onEvent,
      },
      this.input,
    );
  }

  setPaused(paused: boolean): void {
    this.match.setPaused(paused);
  }

  setInputEnabled(enabled: boolean): void {
    this.input.setEnabled(enabled);
  }

  onSnapshot(snapshot: SnapshotMessage, receivedAtMilliseconds: number): void {
    this.match.onSnapshot(snapshot, receivedAtMilliseconds);
  }

  update(nowMilliseconds: number, deltaSeconds: number): WorldFrame | null {
    return this.match.update(nowMilliseconds, deltaSeconds);
  }

  dispose(): void {
    this.input.dispose();
  }
}
