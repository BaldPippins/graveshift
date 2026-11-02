export interface ScheduledTask {
  stop(): void;
}

export interface TickScheduler {
  start(intervalMilliseconds: number, onTick: () => void): ScheduledTask;
}
