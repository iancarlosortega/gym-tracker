import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type {
  RoutineCriteria,
  RoutineQueryOptions,
  RoutineRepository,
} from '@gym/domain/routines/repositories/routine.repository'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'

export class InMemoryRoutineRepository implements RoutineRepository {
  readonly routines = new Map<string, Routine>()

  async save(routine: Routine): Promise<void> {
    this.routines.set(routine.id.value, routine)
  }

  async saveAll(routines: readonly Routine[]): Promise<void> {
    for (const routine of routines) this.routines.set(routine.id.value, routine)
  }

  async findOne(criteria: RoutineCriteria): Promise<Routine | null> {
    return this.matching(criteria)[0] ?? null
  }

  async findMany(
    criteria: RoutineCriteria,
    pagination: Pagination,
    options?: RoutineQueryOptions,
  ): Promise<Page<Routine>> {
    const found = this.matching(criteria)

    if (options?.orderBy === 'name') {
      found.sort((left, right) => left.name.value.localeCompare(right.name.value))
    }
    if (options?.orderBy === 'position') {
      found.sort((left, right) => left.position - right.position)
    }

    return Page.create(
      found.slice(pagination.offset, pagination.offset + pagination.limit),
      found.length,
      pagination,
    )
  }

  async count(criteria: RoutineCriteria): Promise<number> {
    return this.matching(criteria).length
  }

  private matching(criteria: RoutineCriteria): Routine[] {
    return [...this.routines.values()].filter((routine) => {
      const id = criteria.get('id')
      const userId = criteria.get('userId')
      const archived = criteria.get('archived')

      if (id !== undefined && routine.id.value !== id) return false
      if (userId !== undefined && routine.userId.value !== userId) return false
      if (archived !== undefined && routine.isArchived !== archived) return false
      return true
    })
  }
}
