import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { startDevServer } from './src/server/index';

export default defineConfig(({ command }) => {
  // Frontend port defaults to 3000 (unchanged), but honors PORT so a second
  // instance (e.g. a preview/test run) can be steered to a free port instead
  // of colliding with an already-running dev server. The backend proxy port
  // rides one above it so the two stay paired without a second env var.
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const apiPort = port + 1;

  // Guard to ensure the Express backend is only initialized once in dev process
  if (command === 'serve' && !(globalThis as any)._yadiraServerStarted) {
    (globalThis as any)._yadiraServerStarted = true;
    process.env.API_PORT = String(apiPort);
    try {
      startDevServer();
    } catch (err) {
      console.error('Failed to auto-start Yadira backend server:', err);
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
