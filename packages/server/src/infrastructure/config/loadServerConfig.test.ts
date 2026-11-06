import { describe, expect, it } from 'vitest';
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
        GRAVESHIFT_ADMIN_DB: '/data/admin.sqlite',
      }).adminDatabase,
    ).toBe('/data/admin.sqlite');
  });
});
