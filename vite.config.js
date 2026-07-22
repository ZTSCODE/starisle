import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5174, host: true, strictPort: true },
  build: { chunkSizeWarningLimit: 1500 },
});
