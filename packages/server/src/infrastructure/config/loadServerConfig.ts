import { NETWORK } from '@graveshift/shared/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ServerConfig } from './ServerConfig.ts';

const DEFAULT_CLIENT_DIST = resolve(import.meta.dirname, '../../../../client/dist');

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === '') {
    return NETWORK.defaultPort;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid port "${raw}"`);
  }
  return port;
}

function resolveClientDist(environment: NodeJS.ProcessEnv): string | null {
  if (environment['NODE_ENV'] !== 'production') {
    return null;
  }
  const path = environment['GRAVESHIFT_CLIENT_DIST'] ?? DEFAULT_CLIENT_DIST;
  return existsSync(path) ? path : null;
}

export function loadServerConfig(environment: NodeJS.ProcessEnv): ServerConfig {
  return {
    host: environment['HOST'] ?? '0.0.0.0',
    port: parsePort(environment['PORT'] ?? environment['GRAVESHIFT_SERVER_PORT']),
    clientDistPath: resolveClientDist(environment),
  };
}
