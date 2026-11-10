export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly clientDistPath: string | null;
  readonly version: string;
  readonly adminKey: string | null;
  readonly adminSettingsPath: string;
  readonly trustProxy: boolean;
  readonly drainTimeoutMilliseconds: number;
}
