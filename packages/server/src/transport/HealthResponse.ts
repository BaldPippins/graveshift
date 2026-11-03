export interface HealthResponse {
  readonly status: 'ok' | 'draining';
  readonly version: string;
  readonly protocolVersion: number;
}
