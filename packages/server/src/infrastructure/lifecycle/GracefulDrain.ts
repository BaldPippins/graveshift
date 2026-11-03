import { setTimeout as delay } from 'node:timers/promises';
import type { Logger } from '../../application/ports/Logger.ts';

export interface GracefulDrainOptions {
  readonly logger: Logger;
  readonly activeRooms: () => number;
  readonly timeoutMilliseconds: number;
  readonly pollMilliseconds: number;
  readonly now: () => number;
}

export class GracefulDrain {
  private readonly options: GracefulDrainOptions;
  private draining = false;

  constructor(options: GracefulDrainOptions) {
    this.options = options;
  }

  get isDraining(): boolean {
    return this.draining;
  }

  async drain(): Promise<void> {
    this.draining = true;
    const { logger, activeRooms, timeoutMilliseconds, pollMilliseconds, now } = this.options;
    const deadline = now() + timeoutMilliseconds;
    logger.info('Draining rooms', { rooms: activeRooms(), timeoutMilliseconds });
    while (activeRooms() > 0 && now() < deadline) {
      await delay(pollMilliseconds);
    }
    const abandoned = activeRooms();
    if (abandoned > 0) {
      logger.warn('Drain timed out', { rooms: abandoned });
    } else {
      logger.info('Drain complete');
    }
  }
}
