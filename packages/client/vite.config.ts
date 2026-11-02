import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { NETWORK } from '@graveshift/shared/config';

const serverPort = Number(process.env['GRAVESHIFT_SERVER_PORT'] ?? NETWORK.defaultPort);

export default defineConfig({
  plugins: [preact()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/ws': { target: `ws://localhost:${serverPort}`, ws: true },
      '/api': { target: `http://localhost:${serverPort}` },
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
  },
});
