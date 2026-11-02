import { performance } from 'node:perf_hooks';
import type { ScheduledTask } from '../../application/ports/TickScheduler.ts';

const MAX_CATCH_UP_TICKS = 5;

export class TickLoop implements ScheduledTask {
  private readonly intervalMilliseconds: number;
  private readonly onTick: () => void;
  private nextTickAt: number;
  private timer: NodeJS.Timeout | undefined;
  private running = true;

  constructor(intervalMilliseconds: number, onTick: () => void) {
    this.intervalMilliseconds = intervalMilliseconds;
    this.onTick = onTick;
    this.nextTickAt = performance.now() + intervalMilliseconds;
    this.timer = setTimeout(this.loop, intervalMilliseconds);
  }

  stop(): void {
    this.running = false;
    clearTimeout(this.timer);
  }

  private isRunning(): boolean {
    return this.running;
  }

  private readonly loop = (): void => {
    const now = performance.now();
    let ticksRun = 0;
    while (this.isRunning() && now >= this.nextTickAt && ticksRun < MAX_CATCH_UP_TICKS) {
      this.onTick();
      this.nextTickAt += this.intervalMilliseconds;
      ticksRun += 1;
    }
    if (now - this.nextTickAt > this.intervalMilliseconds * MAX_CATCH_UP_TICKS) {
      this.nextTickAt = now + this.intervalMilliseconds;
    }
    if (this.isRunning()) {
      this.timer = setTimeout(this.loop, Math.max(0, this.nextTickAt - performance.now()));
    }
  };
}
