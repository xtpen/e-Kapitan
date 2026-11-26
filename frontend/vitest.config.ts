import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Unit and flow tests (npm test). Runs in a simulated browser (jsdom).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 20000,
  },
});
