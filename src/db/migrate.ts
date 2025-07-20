import 'dotenv/config';

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, pgClient } from './connection';

async function main() {
	await migrate(db, { migrationsFolder: 'drizzle' });
	await pgClient.end();
}

main();
