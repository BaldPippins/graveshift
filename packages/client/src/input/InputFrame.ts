import type { AimAssist } from './AimAssist.ts';

export interface InputFrame {
  readonly moveX: number;
  readonly moveY: number;
  readonly aim: number;
  readonly fire: boolean;
  readonly reload: boolean;
  readonly melee: boolean;
  readonly jump: boolean;
}

export interface InputSampleContext {
  readonly playerX: number;
  readonly playerY: number;
  readonly previousAim: number;
  readonly aimAssist: AimAssist;
}
