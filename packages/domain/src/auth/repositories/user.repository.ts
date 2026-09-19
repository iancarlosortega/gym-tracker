import type { User } from '@domain/auth/entities/user.entity.js'
import type { Criteria } from '@domain/shared/value-objects/criteria.vo.js'

export interface UserCriteriaFields {
  readonly id?: string
  readonly email?: string
}

export type UserCriteria = Criteria<UserCriteriaFields>

export interface UserRepository {
  save(user: User): Promise<void>
  findOne(criteria: UserCriteria): Promise<User | null>
  count(criteria: UserCriteria): Promise<number>
}
