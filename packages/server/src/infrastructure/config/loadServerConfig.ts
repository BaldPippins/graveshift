import { NETWORK } from '@graveshift/shared/config';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ServerConfig } from './ServerConfig.ts';

const DEFAULT_ADMIN_DATABASE = resolve(
  import.meta.dirname,
  '../../../../../.graveshift/admin.sqlite',
);
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

function parseDrainSeconds(raw: string | undefined): number {
  if (raw === undefined || raw === '') {
    return 0;
  }
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`Invalid drain timeout "${raw}"`);
  }
  return seconds;
}

function resolveClientDist(environment: NodeJS.ProcessEnv): string | null {
  if (environment['NODE_ENV'] !== 'production') {
    return null;
  }
  const path = environment['GRAVESHIFT_CLIENT_DIST'] ?? DEFAULT_CLIENT_DIST;
  return existsSync(path) ? path : null;
}

export function loadServerConfig(environment: NodeJS.ProcessEnv): ServerConfig {
  const proxy = environment['GRAVESHIFT_TRUST_PROXY'] ?? '0';
  if (proxy !== '0' && proxy !== '1') {
    throw new Error('GRAVESHIFT_TRUST_PROXY must be 0 or 1');
  }
  const key = environment['GRAVESHIFT_ADMIN_KEY'] ?? '';
  if (key !== '' && !/^[A-Za-z0-9_-]{32,128}$/.test(key)) {
    throw new Error('GRAVESHIFT_ADMIN_KEY must be 32-128 URL-safe characters');
  }
  const adminDatabase =
    environment['GRAVESHIFT_ADMIN_DB'] ??
    (environment['NODE_ENV'] === 'production' ? ':memory:' : DEFAULT_ADMIN_DATABASE);
  if (key !== '' && environment['NODE_ENV'] === 'production' && adminDatabase === ':memory:') {
    throw new Error('GRAVESHIFT_ADMIN_DB must point to persistent storage');
  }
  return {
    trustProxy: proxy === '1',
    adminKey: key === '' ? null : key,
    adminDatabase,
    host: environment['HOST'] ?? '0.0.0.0',
    port: parsePort(environment['PORT'] ?? environment['GRAVESHIFT_SERVER_PORT']),
    clientDistPath: resolveClientDist(environment),
    version: environment['GRAVESHIFT_VERSION'] ?? 'dev',
    drainTimeoutMilliseconds: parseDrainSeconds(environment['GRAVESHIFT_DRAIN_SECONDS']) * 1000,
  };
}
