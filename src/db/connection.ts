import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schemas';
import { env } from '@/env';

let db: PostgresJsDatabase<typeof schema>;
let pgClient: ReturnType<typeof postgres>;

if (env.NODE_ENV === 'production') {
	pgClient = postgres(env.DATABASE_URL);
	db = drizzle(pgClient, { schema });
} else {
	if (!(global as any).database!) {
		pgClient = postgres(env.DATABASE_URL);
		(global as any).database = drizzle(pgClient, { schema });
	}
	db = (global as any).database;
}

export { db, pgClient };
