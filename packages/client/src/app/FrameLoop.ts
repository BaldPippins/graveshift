const MAX_DELTA_SECONDS = 0.1;

export class FrameLoop {
  private readonly onFrame: (nowMilliseconds: number, deltaSeconds: number) => void;
  private handle = 0;
  private last = 0;

  constructor(onFrame: (nowMilliseconds: number, deltaSeconds: number) => void) {
    this.onFrame = onFrame;
  }

  start(): void {
    this.last = performance.now();
    this.handle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.handle);
  }

  private readonly tick = (now: number): void => {
    const delta = Math.min(MAX_DELTA_SECONDS, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.onFrame(now, delta);
    this.handle = requestAnimationFrame(this.tick);
  };
}
