import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

/** Vitest runs with apps/api as its root, where the drizzle output lives. */
const migrationsDirectory = join(process.cwd(), 'drizzle')

/**
 * An in-process Postgres for tests.
 *
 * PGlite is Postgres itself compiled to WebAssembly, so constraint behaviour is
 * the real thing rather than an approximation: a test that proves a CHECK
 * rejects a row proves it about the database that will run in production.
 */
export async function createTestDatabase(): Promise<PGlite> {
  const database = new PGlite()
  const migration = readFileSync(join(migrationsDirectory, '0000_initial.sql'), 'utf8')

  await database.exec(migration.replaceAll('--> statement-breakpoint', ''))

  return database
}

export interface SeededReferences {
  readonly userId: string
  readonly exerciseId: string
  readonly barbellId: string
  readonly machineId: string
  readonly sessionId: string
}

/** Minimum rows a logged set needs to exist at all. */
export async function seedReferences(database: PGlite): Promise<SeededReferences> {
  const [user] = (
    await database.query<{ id: string }>(
      `INSERT INTO app_user (email, password_hash) VALUES ('ian@example.test', 'hash') RETURNING id`,
    )
  ).rows
  const userId = user?.id ?? ''

  const [exercise] = (
    await database.query<{ id: string }>(
      `INSERT INTO exercise (user_id, name, default_mode) VALUES ($1, 'Bench Press', 'PER_SIDE') RETURNING id`,
      [userId],
    )
  ).rows

  const [barbell] = (
    await database.query<{ id: string }>(
      `INSERT INTO equipment (user_id, name, kind, bar_grams) VALUES ($1, 'Olympic Bar', 'BARBELL', 20000) RETURNING id`,
      [userId],
    )
  ).rows

  const [machine] = (
    await database.query<{ id: string }>(
      `INSERT INTO equipment (user_id, name, kind, stack_positions) VALUES ($1, 'Seated Row', 'STACK', 15) RETURNING id`,
      [userId],
    )
  ).rows

  const sessionId = '0199a1f0-0000-7000-8000-00000000f001'
  await database.query(
    `INSERT INTO workout_session (id, user_id, started_at) VALUES ($1, $2, NOW())`,
    [sessionId, userId],
  )

  return {
    userId,
    exerciseId: exercise?.id ?? '',
    barbellId: barbell?.id ?? '',
    machineId: machine?.id ?? '',
    sessionId,
  }
}
