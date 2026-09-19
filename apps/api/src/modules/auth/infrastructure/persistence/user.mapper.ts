import type { appUser } from '@api/database/schema/user.table.js'
import { User } from '@gym/domain/auth/entities/user.entity'
import { Email } from '@gym/domain/auth/value-objects/email.vo'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import type { DisplayUnit } from '@gym/domain/measurement/value-objects/grams.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

type UserRow = typeof appUser.$inferSelect
type UserInsert = typeof appUser.$inferInsert

export const userMapper = {
  toDomain(row: UserRow): User {
    return User.restore({
      id: Id.restore(row.id),
      email: Email.create(row.email),
      passwordHash: PasswordHash.create(row.passwordHash),
      displayUnit: row.displayUnit as DisplayUnit,
      createdAt: row.createdAt,
    })
  },

  toRow(user: User): UserInsert {
    return {
      id: user.id.value,
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      displayUnit: user.displayUnit,
      createdAt: user.createdAt,
    }
  },
}
