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
import type { PGlite } from '@electric-sql/pglite'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { DrizzleEquipmentUsageRepository } from './drizzle-equipment-usage.repository.ts'

let counter = 0
const nextId = () => `0199a1f0-0000-7000-8000-${String(++counter).padStart(12, '0')}`

let client: PGlite
let usage: DrizzleEquipmentUsageRepository
let sets: DrizzleSetRepository
let references: SeededReferences

const barbellSet = (exerciseId: string, sessionId = references.sessionId) =>
  LoggedSet.create({
    id: nextId(),
    sessionId,
    exerciseId,
    equipmentId: references.barbellId,
    entry: LoadEntry.total(fromKilograms(60)),
    reps: reps(5),
    loggedAt: new Date('2026-09-15T10:00:00.000Z'),
    snapshot: { barGrams: 20_000, displayUnit: 'KG', equipmentId: references.barbellId },
  })

const insertReturningId = async (query: string, params: unknown[]): Promise<string> =>
  (await client.query<{ id: string }>(query, params)).rows[0]?.id ?? ''

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
  usage = new DrizzleEquipmentUsageRepository(database as unknown as Database)
})

describe('counting how much equipment is used', () => {
  it('counts distinct exercises and every set', async () => {
    const squat = await insertReturningId(
      `INSERT INTO exercise (user_id, name, default_mode) VALUES ($1, 'Squat', 'TOTAL') RETURNING id`,
      [references.userId],
    )
    await sets.saveMany([
      barbellSet(references.exerciseId),
      barbellSet(references.exerciseId),
      barbellSet(squat),
    ])

    expect(await usage.usageOf(references.userId, references.barbellId)).toEqual({
      exercises: 2,
      sets: 3,
    })
  })

  it('answers zero for equipment nothing was logged on', async () => {
    expect(await usage.usageOf(references.userId, references.machineId)).toEqual({
      exercises: 0,
      sets: 0,
    })
  })

  it('leaves out a set that was deleted', async () => {
    const set = barbellSet(references.exerciseId)
    await sets.save(set)
    await sets.delete(set.id)

    expect(await usage.usageOf(references.userId, references.barbellId)).toEqual({
      exercises: 0,
      sets: 0,
    })
  })

  it('never counts another user’s sets', async () => {
    const stranger = await insertReturningId(
      `INSERT INTO app_user (email, password_hash) VALUES ('other@example.test', 'hash') RETURNING id`,
      [],
    )
    const strangerSession = '0199a1f0-0000-7000-8000-00000000f0ff'
    await client.query(
      `INSERT INTO workout_session (id, user_id, started_at) VALUES ($1, $2, NOW())`,
      [strangerSession, stranger],
    )
    await sets.save(barbellSet(references.exerciseId, strangerSession))

    expect(await usage.usageOf(references.userId, references.barbellId)).toEqual({
      exercises: 0,
      sets: 0,
    })
  })
})
