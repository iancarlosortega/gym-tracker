import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const source = fileURLToPath(new URL('./src', import.meta.url))
const domain = fileURLToPath(new URL('../../packages/domain/src', import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@api\/(.*)\.js$/, replacement: `${source}/$1.ts` },
      { find: /^@api\//, replacement: `${source}/` },
      // The domain is consumed as source in tests, so its own prefix resolves too.
      { find: /^@domain\/(.*)\.js$/, replacement: `${domain}/$1.ts` },
      { find: /^@domain\//, replacement: `${domain}/` },
      { find: /^@gym\/domain\/(.*)$/, replacement: `${domain}/$1.ts` },
    ],
  },
  test: {
    setupFiles: ['reflect-metadata'],
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
