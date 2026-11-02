import type { Logger } from '../ports/Logger.ts';

export class SilentLogger implements Logger {
  info(): void {
    return;
  }

  warn(): void {
    return;
  }

  error(): void {
    return;
  }
}
