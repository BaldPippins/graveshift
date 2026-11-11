export interface HealthResponse {
  readonly status: 'ok' | 'draining' | 'no-levels';
  readonly version: string;
  readonly protocolVersion: number;
}
