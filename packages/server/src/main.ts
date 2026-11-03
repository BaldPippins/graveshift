import { randomInt, randomUUID } from 'node:crypto';
import { SeededRandom } from '@graveshift/shared/core';
import { RoomCodeGenerator } from './application/lobby/RoomCodeGenerator.ts';
import { RoomRegistry } from './application/lobby/RoomRegistry.ts';
import { SessionController } from './application/session/SessionController.ts';
import { loadServerConfig } from './infrastructure/config/loadServerConfig.ts';
import { GracefulDrain } from './infrastructure/lifecycle/GracefulDrain.ts';
import { ConsoleLogger } from './infrastructure/logging/ConsoleLogger.ts';
import { DriftCorrectedTickScheduler } from './infrastructure/timing/DriftCorrectedTickScheduler.ts';
import { createHttpServer } from './transport/createHttpServer.ts';

const SEED_RANGE = 2 ** 31;
const DRAIN_POLL_MILLISECONDS = 1000;

const logger = new ConsoleLogger();
const config = loadServerConfig(process.env);
const rooms = new RoomRegistry({
  scheduler: new DriftCorrectedTickScheduler(),
  logger,
  codes: new RoomCodeGenerator(new SeededRandom(randomInt(SEED_RANGE))),
  nextSeed: () => randomInt(SEED_RANGE),
});
const controller = new SessionController({ rooms, logger, createResumeToken: () => randomUUID() });
const drain = new GracefulDrain({
  logger,
  activeRooms: () => rooms.size,
  timeoutMilliseconds: config.drainTimeoutMilliseconds,
  pollMilliseconds: DRAIN_POLL_MILLISECONDS,
  now: () => Date.now(),
});
const app = await createHttpServer(config, controller, drain, logger);

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
