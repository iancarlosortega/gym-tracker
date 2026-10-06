import { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import type {
  SetCriteriaFields,
  SetRepository,
  SetSortField,
} from '@domain/measurement/repositories/set.repository.js'
import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { reps } from '@domain/measurement/value-objects/reps.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { Criteria } from '@domain/shared/value-objects/criteria.vo.js'
import { DateRange } from '@domain/shared/value-objects/date-range.vo.js'
import { Pagination } from '@domain/shared/value-objects/pagination.vo.js'
import { QueryOptions } from '@domain/shared/value-objects/query-options.vo.js'
import { beforeEach, describe, expect, it } from 'vitest'

/**
 * Ids and foreign keys the adapter needs to already accept.
 *
 * Postgres enforces references, IndexedDB has none, so each adapter supplies
 * whatever its own storage requires and the contract only uses the values.
 */
export interface SetReferences {
  readonly sessionId: string
  readonly exerciseId: string
  readonly barbellId: string
  readonly machineId: string
}

export interface SetRepositoryHarness {
  /** Named in the test output, so a failure says which adapter broke. */
  readonly name: string
  /** A repository with empty storage, plus the references its sets may use. */
  create(): Promise<{
    readonly repository: SetRepository
    readonly references: SetReferences
  }>
}

/**
 * The behaviour every `SetRepository` must exhibit, whichever storage backs it.
 *
 * The offline queue is not a cache with its own rules — it is the same port
 * as the database, so whatever Postgres answers, IndexedDB must answer
 * identically. That is the whole reason synchronisation can be "drain one
 * repository into another" rather than a second code path with its own bugs.
 *
 * Storage-specific behaviour stays out: Postgres tombstones a delete so a
 * replayed create cannot resurrect it, and the queue simply drops the row it
 * no longer needs to send. Both hide the set from every read, and that is
 * what this suite pins.
 */
export function describeSetRepositoryContract(harness: SetRepositoryHarness): void {
  describe(`SetRepository contract: ${harness.name}`, () => {
    const ids = {
      first: '0199a1f0-0000-7000-8000-00000000c001',
      second: '0199a1f0-0000-7000-8000-00000000c002',
      third: '0199a1f0-0000-7000-8000-00000000c003',
    }
    const noCriteria = Criteria.none<SetCriteriaFields>()

    let repository: SetRepository
    let references: SetReferences

    beforeEach(async () => {
      const created = await harness.create()
      repository = created.repository
      references = created.references
    })

    function benchPress(
      id: string,
      loggedAt = new Date('2026-09-19T18:00:00.000Z'),
      repetitions = 8,
    ): LoggedSet {
      return LoggedSet.create({
        id,
        sessionId: references.sessionId,
        exerciseId: references.exerciseId,
        equipmentId: references.barbellId,
        entry: LoadEntry.perSide(fromKilograms(20), fromKilograms(20)),
        reps: reps(repetitions),
        loggedAt,
        snapshot: {
          barGrams: fromKilograms(20),
          displayUnit: 'KG',
          equipmentId: references.barbellId,
        },
      })
    }

    function machineRow(id: string, loggedAt = new Date('2026-09-19T18:10:00.000Z')): LoggedSet {
      return LoggedSet.create({
        id,
        sessionId: references.sessionId,
        exerciseId: references.exerciseId,
        equipmentId: references.machineId,
        entry: LoadEntry.stack(stackPosition(7)),
        reps: reps(12),
        loggedAt,
        snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: references.machineId },
      })
    }

    describe('round-tripping a set', () => {
      it('restores a per-side set with its resolved mass intact', async () => {
        await repository.save(benchPress(ids.first))

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.first }),
        )

        expect(found?.id).toBe(ids.first)
        expect(found?.mass()).toEqual({ kind: 'resolved', grams: 60_000 })
        expect(found?.entry.toJSON().mode).toBe('PER_SIDE')
        expect(found?.reps).toBe(8)
      })

      it('restores a per-side set that counts no bar, never as a 0 g bar', async () => {
        await repository.save(
          LoggedSet.create({
            id: ids.third,
            sessionId: references.sessionId,
            exerciseId: references.exerciseId,
            equipmentId: references.barbellId,
            entry: LoadEntry.perSide(fromKilograms(20), null),
            reps: reps(8),
            loggedAt: new Date('2026-09-19T18:05:00.000Z'),
            snapshot: { barGrams: null, displayUnit: 'KG', equipmentId: references.barbellId },
          }),
        )

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.third }),
        )

        expect(found?.mass()).toEqual({ kind: 'resolved', grams: 40_000 })
        expect(found?.snapshot.barGrams).toBeNull()
      })

      it('restores an ordinal set without inventing a mass', async () => {
        await repository.save(machineRow(ids.second))

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.second }),
        )

        expect(found?.mass().kind).toBe('not-applicable')
        expect(found?.countsTowardsMassAggregate()).toBe(false)
      })

      it('preserves the stored revision rather than restarting it', async () => {
        await repository.save(benchPress(ids.first).correctReps(reps(10)))

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.first }),
        )

        expect(found?.revision).toBe(1)
        expect(found?.reps).toBe(10)
      })

      it('saves a batch in one call', async () => {
        await repository.saveMany([benchPress(ids.first), machineRow(ids.second)])

        expect(await repository.count(noCriteria)).toBe(2)
      })

      it('accepts an empty batch without writing anything', async () => {
        await repository.saveMany([])

        expect(await repository.count(noCriteria)).toBe(0)
      })
    })

    describe('idempotent delivery', () => {
      it('holds exactly one set when the same one is delivered twice', async () => {
        const set = benchPress(ids.first)

        await repository.save(set)
        await repository.save(set)

        expect(await repository.count(noCriteria)).toBe(1)
      })

      it('applies a newer correction on replay', async () => {
        await repository.save(benchPress(ids.first))
        await repository.save(benchPress(ids.first).correctReps(reps(12)))

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.first }),
        )

        expect(found?.reps).toBe(12)
        expect(found?.revision).toBe(1)
      })

      it('applies a corrected load, still resolved against the stored bar', async () => {
        await repository.save(benchPress(ids.first))
        await repository.save(
          benchPress(ids.first).correct({ load: { grams: fromKilograms(25) }, reps: reps(6) }),
        )

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.first }),
        )

        expect(found?.mass()).toEqual({ kind: 'resolved', grams: fromKilograms(70) })
        expect(found?.reps).toBe(6)
        expect(found?.snapshot.barGrams).toBe(fromKilograms(20))
      })

      it('moves an ordinal set to its corrected position', async () => {
        await repository.save(machineRow(ids.second))
        await repository.save(
          machineRow(ids.second).correct({ load: { position: stackPosition(9) }, reps: reps(10) }),
        )

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.second }),
        )

        expect(found?.entry.toJSON()).toEqual({ mode: 'STACK_POSITION', position: 9 })
      })

      it('breaks a revision tie by the moment the set was logged', async () => {
        const later = benchPress(ids.first, new Date('2026-09-19T18:30:00.000Z'))
        const earlier = benchPress(ids.first, new Date('2026-09-19T18:00:00.000Z'))

        await repository.save(later)
        await repository.save(earlier)

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.first }),
        )

        expect(found?.loggedAt).toEqual(later.loggedAt)
      })

      it('does not let a replayed older edit overwrite a newer one', async () => {
        const original = benchPress(ids.first)
        await repository.save(original.correctReps(reps(12)))
        await repository.save(original)

        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: ids.first }),
        )

        expect(found?.reps).toBe(12)
      })
    })

    describe('querying by criteria', () => {
      beforeEach(async () => {
        await repository.saveMany([
          benchPress(ids.first, new Date('2026-09-19T18:00:00.000Z')),
          machineRow(ids.second, new Date('2026-09-19T18:10:00.000Z')),
          benchPress(ids.third, new Date('2026-09-20T09:00:00.000Z')),
        ])
      })

      it('answers null when nothing matches', async () => {
        const found = await repository.findOne(
          Criteria.create<SetCriteriaFields>({ id: '0199a1f0-0000-7000-8000-0000000000ff' }),
        )

        expect(found).toBeNull()
      })

      it('filters by session', async () => {
        const page = await repository.findMany(
          Criteria.create<SetCriteriaFields>({ sessionId: references.sessionId }),
          Pagination.create({ limit: 10 }),
        )

        expect(page.total).toBe(3)
      })

      it('filters by measurement mode', async () => {
        const page = await repository.findMany(
          Criteria.create<SetCriteriaFields>({ mode: 'STACK_POSITION' }),
          Pagination.create({ limit: 10 }),
        )

        expect(page.items.map((set) => set.id)).toEqual([ids.second])
      })

      it('filters by a list of ids', async () => {
        const page = await repository.findMany(
          Criteria.create<SetCriteriaFields>({ ids: [ids.first, ids.third] }),
          Pagination.create({ limit: 10 }),
        )

        expect(page.total).toBe(2)
      })

      it('filters by a date range, inclusive of its bounds', async () => {
        const page = await repository.findMany(
          Criteria.create<SetCriteriaFields>({
            loggedBetween: DateRange.between(
              new Date('2026-09-19T18:00:00.000Z'),
              new Date('2026-09-19T18:10:00.000Z'),
            ),
          }),
          Pagination.create({ limit: 10 }),
        )

        expect(page.total).toBe(2)
      })

      it('orders and limits', async () => {
        const page = await repository.findMany(
          noCriteria,
          Pagination.create({ limit: 2 }),
          QueryOptions.none<SetSortField>().orderedBy('loggedAt'),
        )

        expect(page.items.map((set) => set.id)).toEqual([ids.first, ids.second])
        expect(page.total).toBe(3)
      })

      it('counts with the same criteria it queries with', async () => {
        const criteria = Criteria.create<SetCriteriaFields>({ exerciseId: references.exerciseId })

        const page = await repository.findMany(criteria, Pagination.create({ limit: 10 }))

        expect(await repository.count(criteria)).toBe(page.total)
      })
    })

    describe('deleting', () => {
      it('hides the set from every read', async () => {
        await repository.save(benchPress(ids.first))

        await repository.delete(ids.first)

        expect(
          await repository.findOne(Criteria.create<SetCriteriaFields>({ id: ids.first })),
        ).toBeNull()
        expect(await repository.count(noCriteria)).toBe(0)
      })

      it('is silent about a set that is not there', async () => {
        await expect(repository.delete(ids.first)).resolves.toBeUndefined()
      })
    })
  })
}
