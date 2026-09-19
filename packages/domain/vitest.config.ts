import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const source = fileURLToPath(new URL('./src', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      // Alias specifiers carry the emitted .js extension; map them back to source.
      { find: /^@domain\/(.*)\.js$/, replacement: `${source}/$1.ts` },
      { find: /^@domain\//, replacement: `${source}/` },
    ],
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
