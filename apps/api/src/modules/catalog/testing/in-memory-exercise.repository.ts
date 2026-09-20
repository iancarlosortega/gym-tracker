import type { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import type {
  ExerciseCriteria,
  ExerciseQueryOptions,
  ExerciseRepository,
} from '@gym/domain/catalog/repositories/exercise.repository'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'

export class InMemoryExerciseRepository implements ExerciseRepository {
  readonly exercises = new Map<string, Exercise>()

  async save(exercise: Exercise): Promise<void> {
    this.exercises.set(exercise.id.value, exercise)
  }

  async findOne(criteria: ExerciseCriteria): Promise<Exercise | null> {
    return this.matching(criteria)[0] ?? null
  }

  async findMany(
    criteria: ExerciseCriteria,
    pagination: Pagination,
    options?: ExerciseQueryOptions,
  ): Promise<Page<Exercise>> {
    const found = this.matching(criteria)

    if (options?.orderBy === 'name') {
      found.sort((left, right) => left.name.value.localeCompare(right.name.value))
    }
    if (options?.direction === 'desc') {
      found.reverse()
    }

    // Mirrors the database adapter: the page and its total come from the same
    // filtered set, so they cannot disagree.
    const window = found.slice(pagination.offset, pagination.offset + pagination.limit)

    return Page.create(window, found.length, pagination)
  }

  async count(criteria: ExerciseCriteria): Promise<number> {
    return this.matching(criteria).length
  }

  private matching(criteria: ExerciseCriteria): Exercise[] {
    return [...this.exercises.values()].filter((exercise) => {
      const id = criteria.get('id')
      const userId = criteria.get('userId')
      const name = criteria.get('name')
      const archived = criteria.get('archived')

      if (id !== undefined && exercise.id.value !== id) return false
      if (userId !== undefined && exercise.userId.value !== userId) return false
      if (name !== undefined && exercise.name.value.toLowerCase() !== name.toLowerCase())
        return false
      if (archived !== undefined && exercise.isArchived !== archived) return false
      return true
    })
  }
}
