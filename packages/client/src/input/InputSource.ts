import type { InputSampleContext } from './InputFrame.ts';

export interface InputSourceState {
  readonly moveX: number;
  readonly moveY: number;
  readonly aim: number | null;
  readonly fire: boolean;
  readonly reload: boolean;
  readonly melee: boolean;
  readonly jump: boolean;
}

export interface InputSource {
  read(context: InputSampleContext): InputSourceState;
  reset(): void;
  dispose(): void;
}
