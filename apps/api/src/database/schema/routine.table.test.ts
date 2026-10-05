import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { describe, expect, it } from 'vitest'

const migration = (tag: string) =>
  readFileSync(join(process.cwd(), 'drizzle', `${tag}.sql`), 'utf8').replaceAll(
    '--> statement-breakpoint',
    '',
  )

/** A database as production had it before routines had an order. */
async function beforeOrdering(): Promise<PGlite> {
  const database = new PGlite()
  await database.exec(migration('0000_initial'))
  await database.exec(migration('0001_optional_base_weight'))
  return database
}

async function user(database: PGlite, email: string): Promise<string> {
  const { rows } = await database.query<{ id: string }>(
    `INSERT INTO app_user (email, password_hash) VALUES ($1, 'hash') RETURNING id`,
    [email],
  )
  return rows[0]?.id as string
}

// Two fresh Postgres instances per test: slow to boot when the workspace runs in parallel.
describe('migration 0002: routine order', { timeout: 30_000 }, () => {
  it('starts existing routines in alphabetical order, per user', async () => {
    const database = await beforeOrdering()
    const ian = await user(database, 'ian@example.test')
    const other = await user(database, 'other@example.test')
    for (const [owner, name] of [
      [ian, 'Push day'],
      [ian, 'Legs'],
      [other, 'Zercher'],
      [ian, 'Pull day'],
    ]) {
      await database.query('INSERT INTO routine (user_id, name) VALUES ($1, $2)', [owner, name])
    }

    await database.exec(migration('0002_routine_position'))

    const { rows } = await database.query<{ user_id: string; name: string; position: number }>(
      'SELECT user_id, name, position FROM routine ORDER BY user_id = $1 DESC, position',
      [ian],
    )
    expect(rows.map(({ name, position }) => [name, position])).toEqual([
      ['Legs', 0],
      ['Pull day', 1],
      ['Push day', 2],
      ['Zercher', 0],
    ])
  })

  it('requires every routine to have a place', async () => {
    const database = await beforeOrdering()
    await database.exec(migration('0002_routine_position'))
    const ian = await user(database, 'ian@example.test')

    await expect(
      database.query('INSERT INTO routine (user_id, name) VALUES ($1, $2)', [ian, 'Arms']),
    ).rejects.toThrow(/position/)
  })
})
