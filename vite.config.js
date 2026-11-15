import { defineConfig } from 'vite';

// Relative base so the built game also runs from file:// and inside a
// desktop wrapper (Phase 5).
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  build: { target: 'es2020', chunkSizeWarningLimit: 1200 },
});
