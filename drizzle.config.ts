import { defineConfig } from 'drizzle-kit';
import { env } from '@/env';

export default defineConfig({
	schema: './src/db/schemas/index.ts',
	dialect: 'postgresql',
	out: './drizzle',
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	verbose: true,
	strict: true,
});
