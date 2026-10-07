import type { Database } from '@api/common/persistence/drizzle.repository.js'
import {
  createTestDatabase,
  resetTestDatabase,
  type SeededReferences,
  seedReferences,
} from '@api/database/testing/test-database.js'
import type { PGlite } from '@electric-sql/pglite'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { DrizzleLastSetsRepository } from './drizzle-last-sets.repository.ts'
import { DrizzleSetRepository, type MeasurementDatabase } from './drizzle-set.repository.ts'

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

let client: PGlite
let lastSets: DrizzleLastSetsRepository
let sets: DrizzleSetRepository
let references: SeededReferences

const session = async (userId: string, startedAt: string) => {
  const id = nextId()
  await client.query(`INSERT INTO workout_session (id, user_id, started_at) VALUES ($1, $2, $3)`, [
    id,
    userId,
    startedAt,
  ])
  return id
}

const setIn = (sessionId: string, kilograms: number, loggedAt: string) =>
  LoggedSet.create({
    id: nextId(),
    sessionId,
    exerciseId: references.exerciseId,
    equipmentId: references.barbellId,
    entry: LoadEntry.total(fromKilograms(kilograms)),
    reps: reps(5),
    loggedAt: new Date(loggedAt),
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: references.barbellId },
  })

beforeAll(async () => {
  client = await createTestDatabase()
})

afterAll(async () => {
  await client.close()
})

beforeEach(async () => {
  await resetTestDatabase(client)
  references = await seedReferences(client)
  const database = drizzle(client)
  sets = new DrizzleSetRepository(database as unknown as MeasurementDatabase)
  lastSets = new DrizzleLastSetsRepository(database as unknown as Database)
})

describe('the sets of an exercise last time', () => {
  it('reads the most recent session that has it, in logged order', async () => {
    const older = await session(references.userId, '2026-09-21T09:00:00Z')
    const recent = await session(references.userId, '2026-09-28T09:00:00Z')
    await sets.saveMany([
      setIn(older, 50, '2026-09-21T09:05:00Z'),
      setIn(recent, 62.5, '2026-09-28T09:10:00Z'),
      setIn(recent, 60, '2026-09-28T09:05:00Z'),
    ])

    const last = await lastSets.lastSession(references.userId, references.exerciseId, null)

    expect(last?.sessionStartedAt).toEqual(new Date('2026-09-28T09:00:00Z'))
    expect(last?.sets.map((entry) => entry.loggedAt.toISOString())).toEqual([
      '2026-09-28T09:05:00.000Z',
      '2026-09-28T09:10:00.000Z',
    ])
  })

  it('skips the session being logged', async () => {
    const older = await session(references.userId, '2026-09-21T09:00:00Z')
    await sets.saveMany([
      setIn(older, 50, '2026-09-21T09:05:00Z'),
      setIn(references.sessionId, 70, new Date().toISOString()),
    ])

    const last = await lastSets.lastSession(
      references.userId,
      references.exerciseId,
      references.sessionId,
    )

    expect(last?.sets).toHaveLength(1)
    expect(last?.sessionStartedAt).toEqual(new Date('2026-09-21T09:00:00Z'))
  })

  it('is nothing for an exercise never done', async () => {
    expect(await lastSets.lastSession(references.userId, references.exerciseId, null)).toBeNull()
  })

  it('never reads another user’s sets', async () => {
    const stranger =
      (
        await client.query<{ id: string }>(
          `INSERT INTO app_user (email, password_hash) VALUES ('other@example.test', 'hash') RETURNING id`,
        )
      ).rows[0]?.id ?? ''
    await sets.save(
      setIn(await session(stranger, '2026-09-28T09:00:00Z'), 80, '2026-09-28T09:05:00Z'),
    )

    expect(await lastSets.lastSession(references.userId, references.exerciseId, null)).toBeNull()
  })
})
