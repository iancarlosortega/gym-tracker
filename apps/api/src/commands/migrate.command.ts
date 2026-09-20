import { join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/**
 * Bring the database up to the schema this build expects.
 *
 * Run as its own step before the API starts rather than on boot: two API
 * containers starting together would otherwise race to apply the same
 * migration, and a failed migration should stop a deployment rather than
 * leave a process half-serving a schema it does not have.
 *
 * `max: 1` because migrations are sequential and a pool buys nothing here.
 *
 * The folder is resolved from the working directory, as the test harness
 * does, so the image runs this from the application root and finds the same
 * `drizzle/` it was built with.
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL

  if (url === undefined || url === '') {
    console.error('DATABASE_URL is not set, so there is no database to migrate.')
    process.exitCode = 1
    return
  }

  const client = postgres(url, { max: 1 })

  try {
    await migrate(drizzle(client), { migrationsFolder: join(process.cwd(), 'drizzle') })
    console.log('Migrations applied.')
  } finally {
    await client.end()
  }
}

void main()
