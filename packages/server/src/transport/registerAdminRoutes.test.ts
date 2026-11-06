import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import { LevelAvailability } from '../application/admin/LevelAvailability.ts';
import { AdminSettingsStore } from '../infrastructure/admin/AdminSettingsStore.ts';
import { registerAdminRoutes } from './registerAdminRoutes.ts';

const KEY = 'a'.repeat(40);

describe('admin routes', () => {
  it('keeps the API unavailable when no admin key is configured', async () => {
    const app = Fastify();
    const store = new AdminSettingsStore(':memory:');
    const levels = new LevelAvailability(new Map([['graveyard', GRAVEYARD_LEVEL]]), store);
    registerAdminRoutes(app, null, levels, () => undefined);
    const response = await app.inject({ method: 'GET', url: '/api/admin/levels' });
    expect(response.statusCode).toBe(503);
    await app.close();
    store.close();
  });
  it('throttles repeated incorrect credentials', async () => {
    const app = Fastify();
    const store = new AdminSettingsStore(':memory:');
    const levels = new LevelAvailability(new Map([['graveyard', GRAVEYARD_LEVEL]]), store);
    registerAdminRoutes(app, KEY, levels, () => undefined);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await app.inject({ method: 'GET', url: '/api/admin/levels' })).statusCode).toBe(401);
    }
    expect((await app.inject({ method: 'GET', url: '/api/admin/levels' })).statusCode).toBe(429);
    await app.close();
    store.close();
  });

  it('limits forwarded clients separately when behind the trusted proxy', async () => {
    const app = Fastify({ trustProxy: 'loopback, linklocal, uniquelocal' });
    const store = new AdminSettingsStore(':memory:');
    const levels = new LevelAvailability(new Map([['graveyard', GRAVEYARD_LEVEL]]), store);
    registerAdminRoutes(app, KEY, levels, () => undefined);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await app.inject({
        method: 'GET',
        url: '/api/admin/levels',
        remoteAddress: '172.18.0.3',
        headers: { 'x-forwarded-for': '203.0.113.1' },
      });
    }
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/api/admin/levels',
          remoteAddress: '172.18.0.3',
          headers: { 'x-forwarded-for': '203.0.113.1', authorization: `Bearer ${KEY}` },
        })
      ).statusCode,
    ).toBe(429);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/api/admin/levels',
          remoteAddress: '172.18.0.3',
          headers: { 'x-forwarded-for': '203.0.113.2', authorization: `Bearer ${KEY}` },
        })
      ).statusCode,
    ).toBe(200);
    await app.close();
    store.close();
  });

  it('does not trust forwarded addresses from a public direct connection', async () => {
    const app = Fastify({ trustProxy: 'loopback, linklocal, uniquelocal' });
    const store = new AdminSettingsStore(':memory:');
    const levels = new LevelAvailability(new Map([['graveyard', GRAVEYARD_LEVEL]]), store);
    registerAdminRoutes(app, KEY, levels, () => undefined);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await app.inject({
        method: 'GET',
        url: '/api/admin/levels',
        remoteAddress: '198.51.100.1',
        headers: { 'x-forwarded-for': `203.0.113.${attempt}` },
      });
    }
    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/levels',
      remoteAddress: '198.51.100.1',
      headers: { 'x-forwarded-for': '203.0.113.20', authorization: `Bearer ${KEY}` },
    });
    expect(response.statusCode).toBe(429);
    await app.close();
    store.close();
  });

  it('requires a key and enforces level availability', async () => {
    const app = Fastify();
    const store = new AdminSettingsStore(':memory:');
    const levels = new LevelAvailability(
      new Map([
        ['graveyard', GRAVEYARD_LEVEL],
        ['arena', { ...GRAVEYARD_LEVEL, id: 'arena' }],
      ]),
      store,
    );
    let changes = 0;
    registerAdminRoutes(app, KEY, levels, () => {
      changes += 1;
    });
    const headers = { authorization: `Bearer ${KEY}` };
    expect((await app.inject({ method: 'GET', url: '/api/admin/levels' })).statusCode).toBe(401);
    expect(
      (
        await app.inject({
          method: 'GET',
          url: '/api/admin/levels',
          headers: { authorization: `Bearer ${'b'.repeat(40)}` },
        })
      ).statusCode,
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/admin/levels/graveyard',
          payload: { enabled: false },
        })
      ).statusCode,
    ).toBe(401);
    expect(levels.enabled.has('graveyard')).toBe(true);
    expect((await app.inject({ method: 'GET', url: '/api/admin/levels', headers })).json()).toEqual(
      [
        { id: 'graveyard', enabled: true },
        { id: 'arena', enabled: true },
      ],
    );
    const update = (id: string, payload: string) =>
      app.inject({
        method: 'PUT',
        url: `/api/admin/levels/${id}`,
        headers: { ...headers, 'content-type': 'application/json' },
        payload,
      });
    expect((await update('graveyard', '{"enabled":false}')).statusCode).toBe(200);
    expect(levels.enabled.has('graveyard')).toBe(false);
    expect(changes).toBe(1);
    expect((await update('arena', '{"enabled":false}')).statusCode).toBe(409);
    expect((await update('missing', '{"enabled":true}')).statusCode).toBe(404);
    expect((await update('arena', '{"enabled":"false"}')).statusCode).toBe(400);
    await app.close();
    store.close();
  });
});
