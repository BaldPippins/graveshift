import type { ScheduledTask, TickScheduler } from '../../application/ports/TickScheduler.ts';
import { TickLoop } from './TickLoop.ts';

export class DriftCorrectedTickScheduler implements TickScheduler {
  start(intervalMilliseconds: number, onTick: () => void): ScheduledTask {
    return new TickLoop(intervalMilliseconds, onTick);
  }
}
