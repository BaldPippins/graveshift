import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { NETWORK } from '@graveshift/shared/config';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { Logger } from '../application/ports/Logger.ts';
import type { SessionController } from '../application/session/SessionController.ts';
import type { ServerConfig } from '../infrastructure/config/ServerConfig.ts';
import { attachWebSocket } from './attachWebSocket.ts';
import type { HealthResponse } from './HealthResponse.ts';

export async function createHttpServer(
  config: ServerConfig,
  controller: SessionController,
  logger: Logger,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(fastifyWebsocket, { options: { maxPayload: NETWORK.maxMessageBytes } });

  app.get('/api/health', (): HealthResponse => ({
    status: 'ok',
    protocolVersion: NETWORK.protocolVersion,
  }));

  app.get(NETWORK.webSocketPath, { websocket: true }, (socket) => {
    attachWebSocket(socket, controller, logger);
  });

  if (config.clientDistPath !== null) {
    await app.register(fastifyStatic, { root: config.clientDistPath, wildcard: false });
    app.setNotFoundHandler((_request, reply) => reply.sendFile('index.html'));
  }

  return app;
}
