import { appUser } from '@api/database/schema/user.table.js'
import type { User } from '@gym/domain/auth/entities/user.entity'
import type { UserCriteria, UserRepository } from '@gym/domain/auth/repositories/user.repository'
import { and, count, eq, type SQL } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { userMapper } from './user.mapper.js'

export type AuthDatabase = PgDatabase<PgQueryResultHKT>

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly database: AuthDatabase) {}

  async save(user: User): Promise<void> {
    const row = userMapper.toRow(user)

    await this.database
      .insert(appUser)
      .values(row)
      .onConflictDoUpdate({
        target: appUser.id,
        set: {
          email: row.email,
          passwordHash: row.passwordHash,
          displayUnit: row.displayUnit,
        },
      })
  }

  async findOne(criteria: UserCriteria): Promise<User | null> {
    const rows = await this.database
      .select()
      .from(appUser)
      .where(this.toCondition(criteria))
      .limit(1)

    const row = rows[0]
    return row === undefined ? null : userMapper.toDomain(row)
  }

  async count(criteria: UserCriteria): Promise<number> {
    const rows = await this.database
      .select({ total: count() })
      .from(appUser)
      .where(this.toCondition(criteria))

    return rows[0]?.total ?? 0
  }

  private toCondition(criteria: UserCriteria): SQL | undefined {
    const conditions: SQL[] = []

    const id = criteria.get('id')
    if (id !== undefined) {
      conditions.push(eq(appUser.id, id))
    }

    const email = criteria.get('email')
    if (email !== undefined) {
      conditions.push(eq(appUser.email, email))
    }

    return conditions.length === 0 ? undefined : and(...conditions)
  }
}
