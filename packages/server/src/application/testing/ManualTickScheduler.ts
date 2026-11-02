import type { ScheduledTask, TickScheduler } from '../ports/TickScheduler.ts';

export class ManualTickScheduler implements TickScheduler {
  private readonly tasks = new Set<() => void>();

  get activeTasks(): number {
    return this.tasks.size;
  }

  start(_intervalMilliseconds: number, onTick: () => void): ScheduledTask {
    const callback = (): void => {
      onTick();
    };
    this.tasks.add(callback);
    return {
      stop: () => {
        this.tasks.delete(callback);
      },
    };
  }

  advance(ticks: number): void {
    for (let tick = 0; tick < ticks; tick += 1) {
      [...this.tasks].forEach((task) => {
        task();
      });
    }
  }
}
