import type { LogContext, Logger } from '../../application/ports/Logger.ts';

type LogLevel = 'info' | 'warn' | 'error';

function serializeError(value: unknown): unknown {
  return value instanceof Error
    ? { name: value.name, message: value.message, stack: value.stack }
    : value;
}

export class ConsoleLogger implements Logger {
  info(message: string, context?: LogContext): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.write('error', message, context);
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...Object.fromEntries(
        Object.entries(context ?? {}).map(([key, value]) => [key, serializeError(value)]),
      ),
    };
    const line = JSON.stringify(entry);
    if (level === 'error') {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}
