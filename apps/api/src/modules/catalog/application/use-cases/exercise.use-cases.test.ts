import { ExerciseNotFoundError } from '@gym/domain/catalog/errors'
import type { ExerciseCriteriaFields } from '@gym/domain/catalog/repositories/exercise.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import { FixedClock } from '../../../auth/testing/in-memory-auth.ts'
import { InMemoryExerciseRepository } from '../../testing/in-memory-exercise.repository.ts'
import { ArchiveExerciseUseCase } from './archive-exercise.use-case.ts'
import { CreateExerciseUseCase } from './create-exercise.use-case.ts'
import { ListExercisesUseCase } from './list-exercises.use-case.ts'
import { RenameExerciseUseCase } from './rename-exercise.use-case.ts'

const userId = Id.create().value
const otherUserId = Id.create().value

let exercises: InMemoryExerciseRepository
let create: CreateExerciseUseCase
let rename: RenameExerciseUseCase
let archive: ArchiveExerciseUseCase
let list: ListExercisesUseCase

beforeEach(() => {
  exercises = new InMemoryExerciseRepository()
  create = new CreateExerciseUseCase(exercises)
  rename = new RenameExerciseUseCase(exercises)
  archive = new ArchiveExerciseUseCase(exercises, new FixedClock(new Date('2026-09-19T12:00:00Z')))
  list = new ListExercisesUseCase(exercises)
})

describe('creating an exercise', () => {
  it('stores it against the user who created it', async () => {
    const exercise = await create.execute({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })

    expect(exercise.userId.value).toBe(userId)
    expect(exercises.exercises.size).toBe(1)
  })

  it('reuses an existing name rather than splitting its history across two rows', async () => {
    const first = await create.execute({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })
    const again = await create.execute({ userId, name: 'bench press', defaultMode: 'PER_SIDE' })

    expect(again.id.equals(first.id)).toBe(true)
    expect(exercises.exercises.size).toBe(1)
  })

  it('reactivates an archived exercise instead of creating a duplicate', async () => {
    const first = await create.execute({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })
    await archive.execute({ userId, exerciseId: first.id.value })

    const again = await create.execute({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })

    expect(again.id.equals(first.id)).toBe(true)
    expect(again.isArchived).toBe(false)
  })

  it('lets two users own an exercise of the same name', async () => {
    await create.execute({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })
    await create.execute({ userId: otherUserId, name: 'Bench Press', defaultMode: 'PER_SIDE' })

    expect(exercises.exercises.size).toBe(2)
  })
})

describe('renaming an exercise', () => {
  it('changes the name and keeps the identity', async () => {
    const exercise = await create.execute({ userId, name: 'Bench', defaultMode: 'PER_SIDE' })

    const renamed = await rename.execute({
      userId,
      exerciseId: exercise.id.value,
      name: 'Barbell Bench Press',
    })

    expect(renamed.name.value).toBe('Barbell Bench Press')
    expect(renamed.id.equals(exercise.id)).toBe(true)
  })

  it('refuses an exercise belonging to someone else, rather than renaming it', async () => {
    const exercise = await create.execute({ userId, name: 'Bench', defaultMode: 'PER_SIDE' })

    await expect(
      rename.execute({ userId: otherUserId, exerciseId: exercise.id.value, name: 'Theirs' }),
    ).rejects.toThrow(ExerciseNotFoundError)
  })

  it('refuses an unknown exercise', async () => {
    await expect(
      rename.execute({ userId, exerciseId: Id.create().value, name: 'Nothing' }),
    ).rejects.toThrow(ExerciseNotFoundError)
  })
})

describe('archiving an exercise', () => {
  it('marks it archived without removing it, so its sets still resolve', async () => {
    const exercise = await create.execute({ userId, name: 'Bench', defaultMode: 'PER_SIDE' })

    const archived = await archive.execute({ userId, exerciseId: exercise.id.value })

    expect(archived.isArchived).toBe(true)
    expect(
      await exercises.findOne(Criteria.create<ExerciseCriteriaFields>({ id: exercise.id.value })),
    ).not.toBeNull()
  })

  it('removes it from what routine building sees', async () => {
    const bench = await create.execute({ userId, name: 'Bench', defaultMode: 'PER_SIDE' })
    await create.execute({ userId, name: 'Squat', defaultMode: 'PER_SIDE' })

    await archive.execute({ userId, exerciseId: bench.id.value })

    const available = await list.execute({ userId })
    expect(available.items.map((exercise) => exercise.name.value)).toEqual(['Squat'])
  })

  it('still shows it when archived exercises are asked for', async () => {
    const bench = await create.execute({ userId, name: 'Bench', defaultMode: 'PER_SIDE' })
    await archive.execute({ userId, exerciseId: bench.id.value })

    expect((await list.execute({ userId, includeArchived: true })).items).toHaveLength(1)
  })

  it('refuses an exercise belonging to someone else', async () => {
    const exercise = await create.execute({ userId, name: 'Bench', defaultMode: 'PER_SIDE' })

    await expect(
      archive.execute({ userId: otherUserId, exerciseId: exercise.id.value }),
    ).rejects.toThrow(ExerciseNotFoundError)
  })
})

describe('listing exercises', () => {
  it('orders by name, so the list is predictable at the rack', async () => {
    await create.execute({ userId, name: 'Squat', defaultMode: 'PER_SIDE' })
    await create.execute({ userId, name: 'Bench Press', defaultMode: 'PER_SIDE' })
    await create.execute({ userId, name: 'Lat Pulldown', defaultMode: 'STACK_POSITION' })

    const listed = await list.execute({ userId })

    expect(listed.items.map((exercise) => exercise.name.value)).toEqual([
      'Bench Press',
      'Lat Pulldown',
      'Squat',
    ])
  })

  it("never returns another user's exercises", async () => {
    await create.execute({ userId: otherUserId, name: 'Theirs', defaultMode: 'TOTAL' })

    expect((await list.execute({ userId })).items).toHaveLength(0)
  })
})

describe('pagination', () => {
  beforeEach(async () => {
    for (let index = 1; index <= 7; index += 1) {
      await create.execute({
        userId,
        name: `Exercise ${index}`,
        defaultMode: 'PER_SIDE',
      })
    }
  })

  it('returns a bounded page, the total and whether there is more', async () => {
    const page = await list.execute({ userId, limit: 3 })

    expect(page.items).toHaveLength(3)
    expect(page.total).toBe(7)
    expect(page.hasMore).toBe(true)
    expect(page.limit).toBe(3)
  })

  it('walks to the end and stops claiming there is more', async () => {
    const page = await list.execute({ userId, limit: 3, offset: 6 })

    expect(page.items).toHaveLength(1)
    expect(page.total).toBe(7)
    expect(page.hasMore).toBe(false)
  })

  it('counts every match, not just the page, so page numbers are right', async () => {
    const page = await list.execute({ userId, limit: 2 })

    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(7)
  })

  it('bounds the result even when no limit is asked for', async () => {
    const page = await list.execute({ userId })

    expect(page.limit).toBe(50)
  })

  it('clamps an absurd request rather than reading the whole table', async () => {
    expect((await list.execute({ userId, limit: 10_000 })).limit).toBe(200)
  })
})
