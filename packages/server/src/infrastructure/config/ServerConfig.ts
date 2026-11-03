export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly clientDistPath: string | null;
  readonly version: string;
  readonly drainTimeoutMilliseconds: number;
}
