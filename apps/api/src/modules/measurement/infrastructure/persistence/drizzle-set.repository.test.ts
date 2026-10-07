import {
  createTestDatabase,
  resetTestDatabase,
  seedReferences,
} from '@api/database/testing/test-database.js'
import {
  DrizzleSetRepository,
  type MeasurementDatabase,
} from '@api/modules/measurement/infrastructure/persistence/drizzle-set.repository.js'
import type { PGlite } from '@electric-sql/pglite'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { SetCriteriaFields } from '@gym/domain/measurement/repositories/set.repository'
import { describeSetRepositoryContract } from '@gym/domain/measurement/repositories/set.repository.contract'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

let client: PGlite

beforeAll(async () => {
  client = await createTestDatabase()
})

afterAll(async () => {
  await client.close()
})

async function createRepository() {
  await resetTestDatabase(client)
  const references = await seedReferences(client)

  return {
    repository: new DrizzleSetRepository(drizzle(client) as unknown as MeasurementDatabase),
    references,
  }
}

/**
 * The same suite the IndexedDB queue is held to.
 *
 * Both adapters implement one port, so a behaviour that only one of them has
 * is a behaviour synchronisation cannot rely on. Anything below this line is
 * Postgres keeping a promise the queue has no need to make.
 */
describeSetRepositoryContract({ name: 'DrizzleSetRepository', create: createRepository })

describe('DrizzleSetRepository, beyond the contract', () => {
  const setId = '0199a1f0-0000-7000-8000-00000000b001'

  let repository: DrizzleSetRepository
  let references: Awaited<ReturnType<typeof createRepository>>['references']

  beforeEach(async () => {
    const created = await createRepository()
    repository = created.repository
    references = created.references
  })

  function benchPress(): LoggedSet {
    return LoggedSet.create({
      id: setId,
      sessionId: references.sessionId,
      exerciseId: references.exerciseId,
      equipmentId: references.barbellId,
      entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
      reps: reps(8),
      loggedAt: new Date('2026-09-19T18:00:00.000Z'),
      snapshot: {
        barGrams: fromKilograms(20),
        displayUnit: 'KG',
        equipmentId: references.barbellId,
      },
    })
  }

  /**
   * The queue drops what it has sent; the server keeps a tombstone, because
   * only the server can be handed a replayed create for a set the user has
   * already deleted.
   */
  it('does not resurrect a deleted set when its create is replayed', async () => {
    const set = benchPress()

    await repository.save(set)
    await repository.delete(setId)
    await repository.save(set)

    expect(await repository.findOne(Criteria.create<SetCriteriaFields>({ id: setId }))).toBeNull()
  })
})
