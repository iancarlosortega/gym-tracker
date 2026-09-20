import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  // A glob, not a barrel: index.ts files are forbidden in this repository
  // and drizzle-kit would have failed to find its schema at all.
  schema: './src/database/schema/*.table.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/gymtracker',
  },
  casing: 'snake_case',
})
