import type { Database } from '@api/common/persistence/drizzle.repository.js'
import {
  createTestDatabase,
  type SeededReferences,
  seedReferences,
} from '@api/database/testing/test-database.js'
import type { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { DrizzleRoutineHistoryRepository } from './drizzle-routine-history.repository.ts'

let client: PGlite
let history: DrizzleRoutineHistoryRepository
let references: SeededReferences

const firstId = async (query: string, params: unknown[]): Promise<string> =>
  (await client.query<{ id: string }>(query, params)).rows[0]?.id ?? ''

const routineFor = (userId: string, name: string) =>
  firstId(`INSERT INTO routine (user_id, name) VALUES ($1, $2) RETURNING id`, [userId, name])

const workout = (userId: string, routineId: string | null, startedAt: string) =>
  client.query(
    `INSERT INTO workout_session (id, user_id, routine_id, started_at) VALUES (gen_random_uuid(), $1, $2, $3)`,
    [userId, routineId, startedAt],
  )

beforeEach(async () => {
  client = await createTestDatabase()
  references = await seedReferences(client)
  history = new DrizzleRoutineHistoryRepository(drizzle(client) as unknown as Database)
})

describe('when each routine was last done', () => {
  it('reads the start of the most recent workout that followed it', async () => {
    const legs = await routineFor(references.userId, 'Legs')
    await workout(references.userId, legs, '2026-09-21T09:00:00Z')
    await workout(references.userId, legs, '2026-09-28T09:00:00Z')

    expect((await history.lastDoneAt(references.userId)).get(legs)).toEqual(
      new Date('2026-09-28T09:00:00Z'),
    )
  })

  it('leaves out routines never followed and empty workouts', async () => {
    const legs = await routineFor(references.userId, 'Legs')
    await workout(references.userId, null, '2026-09-28T09:00:00Z')

    const lastDone = await history.lastDoneAt(references.userId)

    expect(lastDone.has(legs)).toBe(false)
    expect(lastDone.size).toBe(0)
  })

  it('never reads another user’s workouts', async () => {
    const stranger = await firstId(
      `INSERT INTO app_user (email, password_hash) VALUES ('other@example.test', 'hash') RETURNING id`,
      [],
    )
    const theirs = await routineFor(stranger, 'Legs')
    await workout(stranger, theirs, '2026-09-28T09:00:00Z')

    expect((await history.lastDoneAt(references.userId)).size).toBe(0)
  })
})
