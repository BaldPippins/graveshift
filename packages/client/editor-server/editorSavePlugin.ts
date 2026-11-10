import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { parseLevelDefinition } from '@graveshift/shared/world';
import { isLoopbackAddress } from './isLoopbackAddress.ts';
import { saveLevel } from './saveLevel.ts';

const MAX_BYTES = 1024 * 1024;
const DIRECTORY = fileURLToPath(new URL('../../shared/src/world/maps/', import.meta.url));

async function handleSave(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (
    !isLoopbackAddress(request.socket.remoteAddress) ||
    request.method !== 'POST' ||
    request.headers.origin !== `http://${request.headers.host}` ||
    request.headers['content-type'] !== 'application/json'
  ) {
    response.writeHead(403).end();
    return;
  }
  let body = '';
  for await (const chunk of request) {
    body += String(chunk);
    if (Buffer.byteLength(body) > MAX_BYTES) {
      response.writeHead(413).end();
      return;
    }
  }
  try {
    parseLevelDefinition(body);
  } catch {
    response.writeHead(400).end();
    return;
  }
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    await saveLevel(DIRECTORY, body, url.searchParams.get('overwrite') === '1');
    response.writeHead(204).end();
  } catch (error: unknown) {
    response.writeHead(error instanceof Error && error.message === 'exists' ? 409 : 500).end();
  }
}

export function editorSavePlugin(): Plugin {
  return {
    name: 'editor-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__editor/save', (request, response) => {
        void handleSave(request, response).catch(() => {
          if (!response.headersSent) {
            response.writeHead(500).end();
          }
        });
      });
    },
  };
}
