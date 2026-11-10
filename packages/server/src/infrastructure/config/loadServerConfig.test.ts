import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loadServerConfig } from './loadServerConfig.ts';

describe('admin server configuration', () => {
  it('disables admin access until a strong key is configured', () => {
    expect(loadServerConfig({}).adminKey).toBeNull();
    expect(loadServerConfig({}).trustProxy).toBe(false);
    expect(loadServerConfig({ GRAVESHIFT_TRUST_PROXY: '1' }).trustProxy).toBe(true);
    expect(() => loadServerConfig({ GRAVESHIFT_TRUST_PROXY: 'true' })).toThrow();
    expect(() => loadServerConfig({ GRAVESHIFT_ADMIN_KEY: 'short' })).toThrow();
    expect(() => loadServerConfig({ GRAVESHIFT_ADMIN_KEY: 'т'.repeat(32) })).toThrow();
    expect(loadServerConfig({ GRAVESHIFT_ADMIN_KEY: 'a'.repeat(32) }).adminKey).toBe(
      'a'.repeat(32),
    );
  });

  it('requires persistent settings when admin access is enabled in production', () => {
    expect(() =>
      loadServerConfig({ NODE_ENV: 'production', GRAVESHIFT_ADMIN_KEY: 'a'.repeat(32) }),
    ).toThrow();
    expect(
      loadServerConfig({
        NODE_ENV: 'production',
        GRAVESHIFT_ADMIN_KEY: 'a'.repeat(32),
        GRAVESHIFT_ADMIN_SETTINGS: '/data/levels.json',
      }).adminSettingsPath,
    ).toBe('/data/levels.json');
  });

  it('requires migration when an existing SQLite database has no JSON settings', () => {
    const directory = mkdtempSync(`${tmpdir()}/graveshift-config-`);
    try {
      const database = `${directory}/admin.sqlite`;
      const settings = `${directory}/levels.json`;
      writeFileSync(database, 'existing data');
      const environment = {
        GRAVESHIFT_ADMIN_DB: database,
        GRAVESHIFT_ADMIN_SETTINGS: settings,
      };
      expect(() => loadServerConfig(environment)).toThrow(/migrate/);
      writeFileSync(settings, '[]');
      expect(loadServerConfig(environment).adminSettingsPath).toBe(settings);
    } finally {
      rmSync(directory, { recursive: true });
    }
  });
});
