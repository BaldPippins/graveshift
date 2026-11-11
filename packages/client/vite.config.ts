import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { NETWORK } from '@graveshift/shared/config';
import { editorSavePlugin } from './editor-server/editorSavePlugin.ts';

const serverPort = Number(process.env['GRAVESHIFT_SERVER_PORT'] ?? NETWORK.defaultPort);

export default defineConfig({
  plugins: [preact(), editorSavePlugin()],
  server: {
    host: true,
    port: 5173,
    watch: { ignored: ['**/shared/src/world/maps/**'] },
    proxy: {
      '/ws': { target: `ws://localhost:${serverPort}`, ws: true },
      '/api': { target: `http://localhost:${serverPort}` },
    },
  },
  build: {
    target: 'es2023',
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
});
