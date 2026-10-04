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
    // The API client refuses to load without an address; tests answer through
    // a stub adapter, so this one is never dialled.
    // biome-ignore lint/style/useNamingConvention: environment variables are SCREAMING_SNAKE_CASE
    env: { NEXT_PUBLIC_API_URL: 'https://api.test' },
  },
})
