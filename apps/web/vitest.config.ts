import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // The same '@/' alias the app and tsconfig use.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Node by default: the queue and sync tests have no DOM in them. A
    // component test asks for jsdom with a docblock, so the environment is
    // declared in the file that needs it rather than by a path convention.
    environment: 'node',
  },
})
