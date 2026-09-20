import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import type { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import type {
  WorkoutSessionCriteria,
  WorkoutSessionQueryOptions,
  WorkoutSessionRepository,
} from '@gym/domain/workouts/repositories/workout-session.repository'

export class InMemoryWorkoutSessionRepository implements WorkoutSessionRepository {
  readonly sessions = new Map<string, WorkoutSession>()

  async save(session: WorkoutSession): Promise<void> {
    this.sessions.set(session.id.value, session)
  }

  async findOne(criteria: WorkoutSessionCriteria): Promise<WorkoutSession | null> {
    return this.matching(criteria)[0] ?? null
  }

  async findMany(
    criteria: WorkoutSessionCriteria,
    pagination: Pagination,
    options?: WorkoutSessionQueryOptions,
  ): Promise<Page<WorkoutSession>> {
    const found = this.matching(criteria)

    if (options?.orderBy === 'startedAt') {
      found.sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
    }

    return Page.create(
      found.slice(pagination.offset, pagination.offset + pagination.limit),
      found.length,
      pagination,
    )
  }

  async count(criteria: WorkoutSessionCriteria): Promise<number> {
    return this.matching(criteria).length
  }

  private matching(criteria: WorkoutSessionCriteria): WorkoutSession[] {
    return [...this.sessions.values()].filter((session) => {
      const id = criteria.get('id')
      const userId = criteria.get('userId')
      const routineId = criteria.get('routineId')
      const finished = criteria.get('finished')

      if (id !== undefined && session.id.value !== id) return false
      if (userId !== undefined && session.userId.value !== userId) return false
      if (routineId !== undefined && session.routineId?.value !== routineId) return false
      if (finished !== undefined && session.isFinished !== finished) return false
      return true
    })
  }
}
