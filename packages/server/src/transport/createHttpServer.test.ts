import { describe, expect, it } from 'vitest';
import { SeededRandom } from '@graveshift/shared/core';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import { LevelAvailability } from '../application/admin/LevelAvailability.ts';
import { RoomCodeGenerator } from '../application/lobby/RoomCodeGenerator.ts';
import { RoomRegistry } from '../application/lobby/RoomRegistry.ts';
import { SessionController } from '../application/session/SessionController.ts';
import { ManualTickScheduler } from '../application/testing/ManualTickScheduler.ts';
import { SilentLogger } from '../application/testing/SilentLogger.ts';
import { AdminSettingsStore } from '../infrastructure/admin/AdminSettingsStore.ts';
import { loadServerConfig } from '../infrastructure/config/loadServerConfig.ts';
import { GracefulDrain } from '../infrastructure/lifecycle/GracefulDrain.ts';
import { createHttpServer } from './createHttpServer.ts';

describe('server health', () => {
  it('is unhealthy without an enabled local map but allows an admin to restore one', async () => {
    const key = 'a'.repeat(40);
    const settings = new AdminSettingsStore(':memory:');
    settings.setLevelEnabled('graveyard', false, ['graveyard', 'arena']);
    const levels = new LevelAvailability(new Map([['graveyard', GRAVEYARD_LEVEL]]), settings);
    const logger = new SilentLogger();
    const rooms = new RoomRegistry({
      scheduler: new ManualTickScheduler(),
      logger,
      codes: new RoomCodeGenerator(new SeededRandom(1)),
      nextSeed: () => 1,
      levels: levels.enabled,
    });
    const controller = new SessionController({
      rooms,
      logger,
      createResumeToken: () => 'test-token',
      refreshAvailability: () => levels.refresh(),
    });
    const drain = new GracefulDrain({
      logger,
      activeRooms: () => rooms.size,
      timeoutMilliseconds: 0,
      pollMilliseconds: 1000,
      now: () => Date.now(),
    });
    const app = await createHttpServer(
      loadServerConfig({ GRAVESHIFT_ADMIN_KEY: key, GRAVESHIFT_TRUST_PROXY: '1' }),
      controller,
      drain,
      logger,
      levels,
    );
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await app.inject({
        method: 'GET',
        url: '/api/admin/levels',
        remoteAddress: '172.18.0.3',
        headers: { 'x-forwarded-for': '203.0.113.1' },
      });
    }
    const otherAdmin = await app.inject({
      method: 'GET',
      url: '/api/admin/levels',
      remoteAddress: '172.18.0.3',
      headers: { 'x-forwarded-for': '203.0.113.2', authorization: `Bearer ${key}` },
    });
    expect(otherAdmin.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(503);
    const update = await app.inject({
      method: 'PUT',
      url: '/api/admin/levels/graveyard',
      headers: { authorization: `Bearer ${key}` },
      payload: { enabled: true },
    });
    expect(update.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(200);
    await app.close();
    settings.close();
  });
});
