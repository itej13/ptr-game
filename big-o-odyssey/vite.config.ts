import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ponytail: one ~285 KB gzipped bundle; split per world only if load time ever matters
  build: { chunkSizeWarningLimit: 1000 },
  test: { testTimeout: 120_000 },
});
