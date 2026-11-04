import { clampLength, vec2 } from '@graveshift/shared/core';
import type { InputFrame, InputSampleContext } from './InputFrame.ts';
import type { InputSource } from './InputSource.ts';

export class InputController {
  private readonly sources: readonly InputSource[];
  private enabled = true;

  constructor(sources: readonly InputSource[]) {
    this.sources = sources;
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled && !enabled) {
      this.sources.forEach((source) => {
        source.reset();
      });
    }
    this.enabled = enabled;
  }

  sample(context: InputSampleContext): InputFrame {
    const states = this.sources.map((source) => source.read(context));
    if (!this.enabled) {
      return {
        moveX: 0,
        moveY: 0,
        aim: context.previousAim,
        fire: false,
        reload: false,
        melee: false,
        jump: false,
      };
    }
    const move = clampLength(
      vec2(
        states.reduce((sum, state) => sum + state.moveX, 0),
        states.reduce((sum, state) => sum + state.moveY, 0),
      ),
      1,
    );
    const aim = states.reduceRight<number | null>((chosen, state) => state.aim ?? chosen, null);
    return {
      moveX: move.x,
      moveY: move.y,
      aim: aim ?? context.previousAim,
      fire: states.some((state) => state.fire),
      reload: states.some((state) => state.reload),
      melee: states.some((state) => state.melee),
      jump: states.some((state) => state.jump),
    };
  }

  dispose(): void {
    this.sources.forEach((source) => {
      source.dispose();
    });
  }
}
