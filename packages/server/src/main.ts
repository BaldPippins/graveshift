import { randomInt, randomUUID } from 'node:crypto';
import { SeededRandom } from '@graveshift/shared/core';
import { RoomCodeGenerator } from './application/lobby/RoomCodeGenerator.ts';
import { RoomRegistry } from './application/lobby/RoomRegistry.ts';
import { SessionController } from './application/session/SessionController.ts';
import { loadServerConfig } from './infrastructure/config/loadServerConfig.ts';
import { ConsoleLogger } from './infrastructure/logging/ConsoleLogger.ts';
import { DriftCorrectedTickScheduler } from './infrastructure/timing/DriftCorrectedTickScheduler.ts';
import { createHttpServer } from './transport/createHttpServer.ts';

const SEED_RANGE = 2 ** 31;

const logger = new ConsoleLogger();
const config = loadServerConfig(process.env);
const rooms = new RoomRegistry({
  scheduler: new DriftCorrectedTickScheduler(),
  logger,
  codes: new RoomCodeGenerator(new SeededRandom(randomInt(SEED_RANGE))),
  nextSeed: () => randomInt(SEED_RANGE),
});
const controller = new SessionController({ rooms, logger, createResumeToken: () => randomUUID() });
const app = await createHttpServer(config, controller, logger);

await app.listen({ host: config.host, port: config.port });
logger.info('Graveshift server listening', {
  host: config.host,
  port: config.port,
  servesClient: config.clientDistPath !== null,
});

const shutdown = (signal: string): void => {
  logger.info('Shutting down', { signal });
  app.close().then(
    () => process.exit(0),
    (error: unknown) => {
      logger.error('Shutdown failed', { error });
      process.exit(1);
    },
  );
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
