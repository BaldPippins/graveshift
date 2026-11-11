import { createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { editorSavePlugin } from './editorSavePlugin.ts';

let vite: ViteDevServer | null = null;

afterEach(async () => {
  if (vite !== null) {
    await vite.close();
    vite = null;
  }
});

describe('editor save endpoint', () => {
  it('checks the socket address even when the origin and host match', async () => {
    vite = await createServer({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        {
          name: 'test-remote-address',
          configureServer(server) {
            server.middlewares.use((request, _response, next) => {
              if (request.url === '/__editor/save?remote=1') {
                Object.defineProperty(request.socket, 'remoteAddress', {
                  value: '192.168.1.5',
                  configurable: true,
                });
              }
              next();
            });
          },
        },
        editorSavePlugin(),
      ],
      server: { middlewareMode: true },
    });
    const http = createHttpServer(vite.middlewares);
    await new Promise<void>((resolve, reject) => {
      http.once('error', reject);
      http.listen(0, '127.0.0.1', resolve);
    });
    try {
      const port = (http.address() as AddressInfo).port;
      const origin = `http://127.0.0.1:${port}`;
      const send = (path: string): Promise<Response> =>
        fetch(`${origin}${path}`, {
          method: 'POST',
          headers: { origin, 'content-type': 'application/json' },
          body: '{}',
        });
      expect((await send('/__editor/save')).status).toBe(400);
      expect((await send('/__editor/save?remote=1')).status).toBe(403);
    } finally {
      http.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        http.close((error) => {
          if (error === undefined) {
            resolve();
          } else {
            reject(error);
          }
        });
      });
    }
  });
});
