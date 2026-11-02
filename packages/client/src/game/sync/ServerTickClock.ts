import { SIMULATION } from '@graveshift/shared/config';

const SMOOTHING = 0.08;
const RESYNC_THRESHOLD_TICKS = 8;

export class ServerTickClock {
  private offsetTicks: number | null = null;

  observe(serverTick: number, receivedAtMilliseconds: number): void {
    const sample = serverTick - receivedAtMilliseconds / SIMULATION.tickMilliseconds;
    if (this.offsetTicks === null || Math.abs(sample - this.offsetTicks) > RESYNC_THRESHOLD_TICKS) {
      this.offsetTicks = sample;
      return;
    }
    const rate = sample > this.offsetTicks ? SMOOTHING * 2 : SMOOTHING;
    this.offsetTicks += (sample - this.offsetTicks) * rate;
  }

  get isSynchronized(): boolean {
    return this.offsetTicks !== null;
  }

  serverTickAt(nowMilliseconds: number): number {
    return nowMilliseconds / SIMULATION.tickMilliseconds + (this.offsetTicks ?? 0);
  }

  renderTickAt(nowMilliseconds: number): number {
    return this.serverTickAt(nowMilliseconds) - SIMULATION.interpolationDelayTicks;
  }
}
