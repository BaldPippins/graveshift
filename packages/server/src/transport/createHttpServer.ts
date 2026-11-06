import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { NETWORK } from '@graveshift/shared/config';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { Logger } from '../application/ports/Logger.ts';
import type { LevelAvailability } from '../application/admin/LevelAvailability.ts';
import type { SessionController } from '../application/session/SessionController.ts';
import type { ServerConfig } from '../infrastructure/config/ServerConfig.ts';
import type { GracefulDrain } from '../infrastructure/lifecycle/GracefulDrain.ts';
import { attachWebSocket } from './attachWebSocket.ts';
import { registerAdminRoutes } from './registerAdminRoutes.ts';
import type { HealthResponse } from './HealthResponse.ts';

export async function createHttpServer(
  config: ServerConfig,
  controller: SessionController,
  drain: GracefulDrain,
  logger: Logger,
  levels: LevelAvailability,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
    trustProxy: config.trustProxy ? 'loopback, linklocal, uniquelocal' : false,
  });

  await app.register(fastifyWebsocket, { options: { maxPayload: NETWORK.maxMessageBytes } });

  app.get('/api/health', (_request, reply): HealthResponse => {
    let status: HealthResponse['status'] = 'ok';
    if (drain.isDraining) {
      status = 'draining';
    } else if (levels.enabled.size === 0) {
      status = 'no-levels';
    }
    reply.code(status === 'ok' ? 200 : 503);
    return {
      status,
      version: config.version,
      protocolVersion: NETWORK.protocolVersion,
    };
  });

  registerAdminRoutes(app, config.adminKey, levels, () => {
    controller.refreshLevels();
  });

  app.get(NETWORK.webSocketPath, { websocket: true }, (socket) => {
    attachWebSocket(socket, controller, logger);
  });

  if (config.clientDistPath !== null) {
    await app.register(fastifyStatic, { root: config.clientDistPath, wildcard: false });
    app.setNotFoundHandler((_request, reply) => reply.sendFile('index.html'));
  }

  return app;
}
