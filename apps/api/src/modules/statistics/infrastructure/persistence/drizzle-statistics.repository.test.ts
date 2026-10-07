import type { Database } from '@api/common/persistence/drizzle.repository.js'
import {
  createTestDatabase,
  resetTestDatabase,
  type SeededReferences,
  seedReferences,
} from '@api/database/testing/test-database.js'
import {
  DrizzleSetRepository,
  type MeasurementDatabase,
} from '@api/modules/measurement/infrastructure/persistence/drizzle-set.repository.js'
import { DrizzleStatisticsRepository } from '@api/modules/statistics/infrastructure/persistence/drizzle-statistics.repository.js'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import { totalVolume } from '@gym/domain/statistics/services/volume.service'
import { drizzle } from 'drizzle-orm/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

const week = DateRange.between(
  new Date('2026-09-14T00:00:00.000Z'),
  new Date('2026-09-20T23:59:59.999Z'),
)

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

let statistics: DrizzleStatisticsRepository
let sets: DrizzleSetRepository
let references: SeededReferences
let client: Awaited<ReturnType<typeof createTestDatabase>>

const barbellSet = (kilograms: number, loggedAt: Date) =>
  LoggedSet.create({
    id: nextId(),
    sessionId: references.sessionId,
    exerciseId: references.exerciseId,
    equipmentId: references.barbellId,
    entry: LoadEntry.total(fromKilograms(kilograms)),
    reps: reps(5),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: references.barbellId },
  })

const machineSet = (position: number, loggedAt: Date) =>
  LoggedSet.create({
    id: nextId(),
    sessionId: references.sessionId,
    exerciseId: references.exerciseId,
    equipmentId: references.machineId,
    entry: LoadEntry.stack(stackPosition(position)),
    reps: reps(10),
    loggedAt,
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: references.machineId },
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
  statistics = new DrizzleStatisticsRepository(database as unknown as Database)
})

describe('reading the sets a statistic is computed from', () => {
  it('returns what was logged inside the period', async () => {
    await sets.saveMany([
      barbellSet(60, new Date('2026-09-15T10:00:00.000Z')),
      barbellSet(80, new Date('2026-09-16T10:00:00.000Z')),
    ])

    expect(await statistics.setsInPeriod(references.userId, week)).toHaveLength(2)
  })

  it('leaves out what was logged outside it', async () => {
    await sets.save(barbellSet(60, new Date('2026-09-01T10:00:00.000Z')))

    expect(await statistics.setsInPeriod(references.userId, week)).toHaveLength(0)
  })

  it('never returns another user’s work', async () => {
    await sets.save(barbellSet(60, new Date('2026-09-15T10:00:00.000Z')))

    const stranger = '0199a1f0-0000-7000-8000-0000000000ff'
    expect(await statistics.setsInPeriod(stranger, week)).toHaveLength(0)
  })

  it('leaves out a set that was deleted', async () => {
    const set = barbellSet(60, new Date('2026-09-15T10:00:00.000Z'))
    await sets.save(set)
    await sets.delete(set.id)

    expect(await statistics.setsInPeriod(references.userId, week)).toHaveLength(0)
  })

  it('narrows to one exercise when asked', async () => {
    await sets.save(barbellSet(60, new Date('2026-09-15T10:00:00.000Z')))

    const found = await statistics.setsForExercise(references.userId, references.exerciseId, week)

    expect(found).toHaveLength(1)
  })

  /**
   * The point of reading sets rather than summing in SQL: the exclusion rule
   * is applied once, in the domain, on whatever came back.
   */
  it('hands back ordinal sets for the domain to exclude, rather than dropping them silently', async () => {
    await sets.saveMany([
      barbellSet(60, new Date('2026-09-15T10:00:00.000Z')),
      machineSet(7, new Date('2026-09-15T11:00:00.000Z')),
    ])

    const found = await statistics.setsInPeriod(references.userId, week)
    expect(found).toHaveLength(2)

    const volume = totalVolume(found)
    expect(volume).toMatchObject({ kind: 'resolved', excludedSets: 1 })
  })
})

describe('reading the workouts in a period', () => {
  const startWorkout = (id: string, userId: string, startedAt: string) =>
    client.query(`INSERT INTO workout_session (id, user_id, started_at) VALUES ($1, $2, $3)`, [
      id,
      userId,
      startedAt,
    ])

  it('returns only the user’s workouts started inside the week', async () => {
    const stranger =
      (
        await client.query<{ id: string }>(
          `INSERT INTO app_user (email, password_hash) VALUES ('other@example.test', 'hash') RETURNING id`,
        )
      ).rows[0]?.id ?? ''
    await startWorkout(nextId(), references.userId, '2026-09-15T08:00:00.000Z')
    await startWorkout(nextId(), references.userId, '2026-09-08T08:00:00.000Z')
    await startWorkout(nextId(), stranger, '2026-09-16T08:00:00.000Z')

    const sessions = await statistics.sessionsInPeriod(references.userId, week)

    expect(sessions.map((session) => session.startedAt.toISOString())).toEqual([
      '2026-09-15T08:00:00.000Z',
    ])
  })
})
