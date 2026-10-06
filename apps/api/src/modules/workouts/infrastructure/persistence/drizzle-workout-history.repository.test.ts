import type { Database } from '@api/common/persistence/drizzle.repository.js'
import {
  createTestDatabase,
  type SeededReferences,
  seedReferences,
} from '@api/database/testing/test-database.js'
import type { PGlite } from '@electric-sql/pglite'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it } from 'vitest'
import { DrizzleWorkoutHistoryRepository } from './drizzle-workout-history.repository.ts'

let client: PGlite
let history: DrizzleWorkoutHistoryRepository
let references: SeededReferences

const firstId = async (query: string, params: unknown[]): Promise<string> =>
  (await client.query<{ id: string }>(query, params)).rows[0]?.id ?? ''

const workout = (
  userId: string,
  startedAt: string,
  routineId: string | null = null,
  finishedAt: string | null = null,
) =>
  firstId(
    `INSERT INTO workout_session (id, user_id, routine_id, started_at, finished_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id`,
    [userId, routineId, startedAt, finishedAt],
  )

const set = (sessionId: string, deleted = false) =>
  client.query(
    `INSERT INTO logged_set (id, session_id, exercise_id, equipment_id, mode, raw_value, raw_unit,
       resolved_grams, snapshot_bar_grams, snapshot_display_unit, reps, logged_at, deleted_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'TOTAL', 60000, 'KG', 60000, NULL, 'KG', 8, NOW(), $4)`,
    [sessionId, references.exerciseId, references.barbellId, deleted ? new Date() : null],
  )

beforeEach(async () => {
  client = await createTestDatabase()
  references = await seedReferences(client)
  // The seed's own session would sit at "now", ahead of every fixture below.
  await client.query('DELETE FROM workout_session')
  history = new DrizzleWorkoutHistoryRepository(drizzle(client) as unknown as Database)
})

describe('the workout history', () => {
  it('lists the newest workout first, with its routine and its live sets counted', async () => {
    const push = await firstId(
      `INSERT INTO routine (user_id, name, position) VALUES ($1, 'Push day', 0) RETURNING id`,
      [references.userId],
    )
    const monday = await workout(references.userId, '2026-09-28T07:30:00Z')
    const thursday = await workout(
      references.userId,
      '2026-10-01T18:10:00Z',
      push,
      '2026-10-01T19:05:00Z',
    )
    await set(thursday)
    await set(thursday)
    await set(thursday, true)

    const page = await history.page(references.userId, Pagination.create({ limit: 20 }))

    expect(page.items).toEqual([
      {
        id: thursday,
        routineId: push,
        routineName: 'Push day',
        startedAt: new Date('2026-10-01T18:10:00Z'),
        finishedAt: new Date('2026-10-01T19:05:00Z'),
        setCount: 2,
      },
      {
        id: monday,
        routineId: null,
        routineName: null,
        startedAt: new Date('2026-09-28T07:30:00Z'),
        finishedAt: null,
        setCount: 0,
      },
    ])
    expect(page.total).toBe(2)
  })

  it('pages without repeating or skipping a workout', async () => {
    for (let day = 1; day <= 5; day += 1) {
      await workout(references.userId, `2026-09-0${day}T08:00:00Z`)
    }

    const first = await history.page(references.userId, Pagination.create({ limit: 2 }))
    const second = await history.page(references.userId, Pagination.create({ limit: 2, offset: 2 }))
    const last = await history.page(references.userId, Pagination.create({ limit: 2, offset: 4 }))

    const days = [...first.items, ...second.items, ...last.items].map((entry) =>
      entry.startedAt.getUTCDate(),
    )
    expect(days).toEqual([5, 4, 3, 2, 1])
    expect(first.hasMore).toBe(true)
    expect(last.hasMore).toBe(false)
  })

  it('never lists another user’s workouts', async () => {
    const other = await firstId(
      `INSERT INTO app_user (email, password_hash) VALUES ('other@example.test', 'hash') RETURNING id`,
      [],
    )
    await workout(other, '2026-10-01T08:00:00Z')

    const page = await history.page(references.userId, Pagination.create({ limit: 20 }))

    expect(page.items).toEqual([])
    expect(page.total).toBe(0)
  })

  it('reads only the workouts started within a range, end excluded', async () => {
    await workout(references.userId, '2026-09-30T23:59:59Z')
    const first = await workout(references.userId, '2026-10-01T05:00:00Z')
    const last = await workout(references.userId, '2026-10-31T23:00:00Z')
    await workout(references.userId, '2026-11-01T05:00:00Z')

    const page = await history.page(references.userId, Pagination.create({ limit: 200 }), {
      from: new Date('2026-10-01T05:00:00Z'),
      to: new Date('2026-11-01T05:00:00Z'),
    })

    expect(page.items.map((entry) => entry.id)).toEqual([last, first])
    expect(page.total).toBe(2)
  })

  it('reads one of the user’s workouts by id, and nobody else’s', async () => {
    const mine = await workout(references.userId, '2026-10-01T18:10:00Z')
    await set(mine)
    const other = await firstId(
      `INSERT INTO app_user (email, password_hash) VALUES ('other@example.test', 'hash') RETURNING id`,
      [],
    )

    expect(await history.entry(references.userId, mine)).toMatchObject({ id: mine, setCount: 1 })
    expect(await history.entry(other, mine)).toBeNull()
  })
})
