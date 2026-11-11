import { randomInt, randomUUID } from 'node:crypto';
import { SeededRandom } from '@graveshift/shared/core';
import { LevelAvailability } from './application/admin/LevelAvailability.ts';
import { AdminSettingsStore } from './infrastructure/admin/AdminSettingsStore.ts';
import { RoomCodeGenerator } from './application/lobby/RoomCodeGenerator.ts';
import { RoomRegistry } from './application/lobby/RoomRegistry.ts';
import { SessionController } from './application/session/SessionController.ts';
import { loadServerConfig } from './infrastructure/config/loadServerConfig.ts';
import { loadLevelCatalog } from './infrastructure/levels/loadLevelCatalog.ts';
import { GracefulDrain } from './infrastructure/lifecycle/GracefulDrain.ts';
import { ConsoleLogger } from './infrastructure/logging/ConsoleLogger.ts';
import { DriftCorrectedTickScheduler } from './infrastructure/timing/DriftCorrectedTickScheduler.ts';
import { createHttpServer } from './transport/createHttpServer.ts';

const SEED_RANGE = 2 ** 31;
const DRAIN_POLL_MILLISECONDS = 1000;
const ADMIN_REFRESH_MILLISECONDS = 1000;

const logger = new ConsoleLogger();
const config = loadServerConfig(process.env);
const catalog = await loadLevelCatalog(new URL('../../shared/src/world/maps/', import.meta.url));
const settings = new AdminSettingsStore(config.adminSettingsPath);
const levels = new LevelAvailability(catalog, settings);
const rooms = new RoomRegistry({
  scheduler: new DriftCorrectedTickScheduler(),
  logger,
  codes: new RoomCodeGenerator(new SeededRandom(randomInt(SEED_RANGE))),
  nextSeed: () => randomInt(SEED_RANGE),
  levels: levels.enabled,
});
const controller = new SessionController({
  rooms,
  logger,
  createResumeToken: () => randomUUID(),
});
const drain = new GracefulDrain({
  logger,
  activeRooms: () => rooms.size,
  timeoutMilliseconds: config.drainTimeoutMilliseconds,
  pollMilliseconds: DRAIN_POLL_MILLISECONDS,
  now: () => Date.now(),
});
const app = await createHttpServer(config, controller, drain, logger, levels);
const adminRefresh = setInterval(() => {
  try {
    if (levels.refresh()) {
      controller.refreshLevels();
    }
  } catch (error: unknown) {
    logger.error('Failed to refresh admin settings', { error });
  }
}, ADMIN_REFRESH_MILLISECONDS);

await app.listen({ host: config.host, port: config.port });
logger.info('Graveshift server listening', {
  host: config.host,
  port: config.port,
  version: config.version,
  servesClient: config.clientDistPath !== null,
});

async function shutDown(signal: string): Promise<void> {
  logger.info('Shutting down', { signal });
  if (signal === 'SIGTERM') {
    logger.info('Released idle sessions', { sessions: controller.releaseIdleSessions() });
    await drain.drain();
  }
  clearInterval(adminRefresh);
  await app.close();
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    shutDown(signal).then(
      () => process.exit(0),
      (error: unknown) => {
        logger.error('Shutdown failed', { error });
        process.exit(1);
      },
    );
  });
}
