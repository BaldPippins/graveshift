import { NETWORK } from '@graveshift/shared/config';
import { decodeClientMessage, ProtocolError } from '@graveshift/shared/protocol';
import type { RawData, WebSocket } from 'ws';
import type { Logger } from '../application/ports/Logger.ts';
import type { SessionController } from '../application/session/SessionController.ts';
import { WebSocketChannel } from './WebSocketChannel.ts';

const SILENCE_CHECK_MILLISECONDS = 1000;

function toBytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) {
    return new Uint8Array(Buffer.concat(data));
  }
  return data instanceof ArrayBuffer
    ? new Uint8Array(data)
    : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export function attachWebSocket(
  socket: WebSocket,
  controller: SessionController,
  logger: Logger,
): void {
  const connection = controller.connect(new WebSocketChannel(socket));
  let lastHeardAt = Date.now();
  const silenceWatch = setInterval(() => {
    if (Date.now() - lastHeardAt > NETWORK.silenceTimeoutMilliseconds) {
      logger.info('Client went silent', { clientId: connection.session.id });
      socket.terminate();
    }
  }, SILENCE_CHECK_MILLISECONDS);

  socket.on('message', (data: RawData, isBinary: boolean) => {
    lastHeardAt = Date.now();
    if (!isBinary) {
      controller.rejectMalformed(connection);
      return;
    }
    try {
      controller.handle(connection, decodeClientMessage(toBytes(data)));
    } catch (error: unknown) {
      if (error instanceof ProtocolError) {
        logger.warn('Malformed client message', {
          clientId: connection.session.id,
          reason: error.message,
        });
        controller.rejectMalformed(connection);
        return;
      }
      logger.error('Failed to handle client message', { clientId: connection.session.id, error });
    }
  });

  socket.once('close', () => {
    clearInterval(silenceWatch);
    socket.removeAllListeners('message');
    controller.disconnect(connection);
  });

  socket.on('error', (error: Error) => {
    logger.warn('Socket error', { clientId: connection.session.id, error });
  });
}
