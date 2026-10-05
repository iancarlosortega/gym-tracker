import { USER_REPOSITORY } from '@api/modules/auth/auth.tokens.js'
import type { User } from '@gym/domain/auth/entities/user.entity'
import { AuthenticationFailedError } from '@gym/domain/auth/errors'
import type {
  UserCriteriaFields,
  UserRepository,
} from '@gym/domain/auth/repositories/user.repository'
import type { DisplayUnit } from '@gym/domain/measurement/value-objects/grams.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Inject, Injectable } from '@nestjs/common'

export interface ChangeDisplayUnitInput {
  readonly userId: string
  readonly displayUnit: DisplayUnit
}

/** Pounds or kilograms, remembered on the server so every device agrees. */
@Injectable()
export class ChangeDisplayUnitUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(input: ChangeDisplayUnitInput): Promise<User> {
    const user = await this.users.findOne(Criteria.create<UserCriteriaFields>({ id: input.userId }))
    if (user === null) {
      throw new AuthenticationFailedError('That account no longer exists.')
    }

    const changed = user.preferring(input.displayUnit)
    await this.users.save(changed)
    return changed
  }
}
