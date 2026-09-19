import type { AuthSession } from '@domain/auth/entities/auth-session.entity.js'
import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'

export interface AuthSessionCriteriaFields {
  readonly id?: string
  readonly userId?: string
}

export type AuthSessionCriteria = Criteria<AuthSessionCriteriaFields>

export interface AuthSessionRepository {
  save(session: AuthSession): Promise<void>
  findOne(criteria: AuthSessionCriteria): Promise<AuthSession | null>
  delete(id: string): Promise<void>
  deleteAllFor(userId: string): Promise<void>
}
