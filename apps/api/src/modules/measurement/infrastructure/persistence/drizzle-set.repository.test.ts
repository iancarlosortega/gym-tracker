import {
  createTestDatabase,
  type SeededReferences,
  seedReferences,
} from '@api/database/testing/test-database.js'
import {
  DrizzleSetRepository,
  type MeasurementDatabase,
} from '@api/modules/measurement/infrastructure/persistence/drizzle-set.repository.js'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type {
  SetCriteriaFields,
  SetSortField,
} from '@gym/domain/measurement/repositories/set.repository'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import { QueryOptions } from '@gym/domain/shared/value-objects/query-options.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it } from 'vitest'

let repository: DrizzleSetRepository
let references: SeededReferences

const ids = {
  first: '0199a1f0-0000-7000-8000-00000000b001',
  second: '0199a1f0-0000-7000-8000-00000000b002',
  third: '0199a1f0-0000-7000-8000-00000000b003',
}

beforeEach(async () => {
  const client = await createTestDatabase()
  references = await seedReferences(client)
  repository = new DrizzleSetRepository(drizzle(client) as unknown as MeasurementDatabase)
})

function benchPress(id: string, loggedAt = new Date('2026-09-19T18:00:00.000Z')): LoggedSet {
  return LoggedSet.create({
    id,
    sessionId: references.sessionId,
    exerciseId: references.exerciseId,
    equipmentId: references.barbellId,
    entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
    reps: reps(8),
    loggedAt,
    snapshot: {
      barGrams: fromKilograms(20),
      displayUnit: 'KG',
      equipmentId: references.barbellId,
    },
  })
}

function machineRow(id: string): LoggedSet {
  return LoggedSet.create({
    id,
    sessionId: references.sessionId,
    exerciseId: references.exerciseId,
    equipmentId: references.machineId,
    entry: LoadEntry.stack(stackPosition(7)),
    reps: reps(12),
    loggedAt: new Date('2026-09-19T18:10:00.000Z'),
    snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: references.machineId },
  })
}

const noCriteria = Criteria.none<SetCriteriaFields>()

describe('round-tripping a set', () => {
  it('restores a per-side set with its resolved mass intact', async () => {
    await repository.save(benchPress(ids.first))

    const found = await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first }))

    expect(found?.id).toBe(ids.first)
    expect(found?.mass()).toEqual({ kind: 'resolved', grams: 60_000 })
    expect(found?.entry.mode).toBe('PER_SIDE')
    expect(found?.reps).toBe(8)
  })

  it('restores an ordinal set without inventing a mass', async () => {
    await repository.save(machineRow(ids.second))

    const found = await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.second }))

    expect(found?.mass().kind).toBe('not-applicable')
    expect(found?.entry.position).toBe(7)
  })

  it('preserves the stored revision rather than restarting it', async () => {
    const corrected = benchPress(ids.first).correctReps(reps(10))
    await repository.save(corrected)

    const found = await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first }))

    expect(found?.revision).toBe(1)
    expect(found?.reps).toBe(10)
  })
})

describe('idempotent delivery', () => {
  it('produces exactly one row when the same set is delivered twice', async () => {
    const set = benchPress(ids.first)

    await repository.save(set)
    await repository.save(set)

    expect(await repository.count(noCriteria)).toBe(1)
  })

  it('applies a newer correction on replay', async () => {
    await repository.save(benchPress(ids.first))
    await repository.save(benchPress(ids.first).correctReps(reps(12)))

    const found = await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first }))
    expect(found?.reps).toBe(12)
    expect(found?.revision).toBe(1)
  })

  it('does not let a replayed older edit overwrite a newer one', async () => {
    const original = benchPress(ids.first)
    await repository.save(original.correctReps(reps(12)))
    await repository.save(original)

    const found = await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first }))
    expect(found?.reps).toBe(12)
  })
})

describe('querying by criteria', () => {
  beforeEach(async () => {
    await repository.saveMany([
      benchPress(ids.first, new Date('2026-09-14T10:00:00.000Z')),
      benchPress(ids.third, new Date('2026-09-21T10:00:00.000Z')),
      machineRow(ids.second),
    ])
  })

  it('filters by session', async () => {
    const found = await repository.findMany(
      Criteria.create<SetCriteriaFields>({ sessionId: references.sessionId }),
    )
    expect(found).toHaveLength(3)
  })

  it('filters by measurement mode', async () => {
    const ordinal = await repository.findMany(
      Criteria.create<SetCriteriaFields>({ mode: 'STACK_POSITION' }),
    )
    expect(ordinal).toHaveLength(1)
    expect(ordinal[0]?.id).toBe(ids.second)
  })

  it('filters by a date range, inclusive of its bounds', async () => {
    const week = DateRange.between(
      new Date('2026-09-14T00:00:00.000Z'),
      new Date('2026-09-20T23:59:59.999Z'),
    )

    const found = await repository.findMany(
      Criteria.create<SetCriteriaFields>({ loggedBetween: week }),
    )

    expect(found.map((set) => set.id)).toEqual([ids.first, ids.second])
  })

  it('filters by a list of ids', async () => {
    const found = await repository.findMany(
      Criteria.create<SetCriteriaFields>({ ids: [ids.first, ids.third] }),
    )
    expect(found).toHaveLength(2)
  })

  it('orders and limits', async () => {
    const newest = await repository.findMany(
      noCriteria,
      QueryOptions.none<SetSortField>().orderedBy('loggedAt', 'desc').limitedTo(1),
    )
    expect(newest[0]?.id).toBe(ids.third)
  })

  it('counts with the same criteria it queries with', async () => {
    expect(await repository.count(Criteria.create<SetCriteriaFields>({ mode: 'PER_SIDE' }))).toBe(2)
  })
})

describe('deleting', () => {
  it('tombstones rather than removing, and hides the set from queries', async () => {
    await repository.save(benchPress(ids.first))
    await repository.delete(ids.first)

    expect(
      await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first })),
    ).toBeNull()
    expect(await repository.count(noCriteria)).toBe(0)
  })

  it('does not resurrect a deleted set when its create is replayed', async () => {
    const set = benchPress(ids.first)
    await repository.save(set)
    await repository.delete(ids.first)
    await repository.save(set)

    expect(
      await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first })),
    ).toBeNull()
  })
})
