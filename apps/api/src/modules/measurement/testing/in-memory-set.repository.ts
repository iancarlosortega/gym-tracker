import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type {
  SetCriteria,
  SetQueryOptions,
  SetRepository,
} from '@gym/domain/measurement/repositories/set.repository'
import { Page } from '@gym/domain/shared/value-objects/page.vo'
import type { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'

/**
 * Keyed by the set's own id, which is what makes it idempotent the same way
 * the Drizzle adapter's upsert is: the same set delivered twice replaces
 * itself rather than arriving twice.
 */
export class InMemorySetRepository implements SetRepository {
  readonly sets = new Map<string, LoggedSet>()

  async save(set: LoggedSet): Promise<void> {
    await this.saveMany([set])
  }

  async saveMany(sets: readonly LoggedSet[]): Promise<void> {
    for (const set of sets) {
      const existing = this.sets.get(set.id)

      // A replayed older edit must not overwrite a newer correction.
      if (existing === undefined || set.revision >= existing.revision) {
        this.sets.set(set.id, set)
      }
    }
  }

  async findOne(criteria: SetCriteria): Promise<LoggedSet | null> {
    return this.matching(criteria)[0] ?? null
  }

  async findMany(
    criteria: SetCriteria,
    pagination: Pagination,
    options?: SetQueryOptions,
  ): Promise<Page<LoggedSet>> {
    const found = this.matching(criteria)

    if (options?.orderBy === 'loggedAt') {
      found.sort((left, right) => left.loggedAt.getTime() - right.loggedAt.getTime())
    }

    return Page.create(
      found.slice(pagination.offset, pagination.offset + pagination.limit),
      found.length,
      pagination,
    )
  }

  async count(criteria: SetCriteria): Promise<number> {
    return this.matching(criteria).length
  }

  async delete(id: string): Promise<void> {
    this.sets.delete(id)
  }

  private matching(criteria: SetCriteria): LoggedSet[] {
    return [...this.sets.values()].filter((set) => {
      const id = criteria.get('id')
      const ids = criteria.get('ids')
      const sessionId = criteria.get('sessionId')
      const exerciseId = criteria.get('exerciseId')
      const mode = criteria.get('mode')
      const loggedBetween = criteria.get('loggedBetween')

      if (id !== undefined && set.id !== id) return false
      if (ids !== undefined && !ids.includes(set.id)) return false
      if (sessionId !== undefined && set.sessionId !== sessionId) return false
      if (exerciseId !== undefined && set.exerciseId !== exerciseId) return false
      if (mode !== undefined && set.entry.toJSON().mode !== mode) return false
      if (loggedBetween !== undefined && !loggedBetween.contains(set.loggedAt)) return false
      return true
    })
  }
}
