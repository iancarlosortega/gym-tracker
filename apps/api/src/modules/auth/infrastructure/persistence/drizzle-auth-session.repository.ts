import { DATABASE } from '@api/database/database.module.js'
import { authSession } from '@api/database/schema/session.table.js'
import type { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import type {
  AuthSessionCriteria,
  AuthSessionRepository,
} from '@gym/domain/auth/repositories/auth-session.repository'
import { Inject, Injectable } from '@nestjs/common'
import { and, eq, type SQL } from 'drizzle-orm'
import { authSessionMapper } from './auth-session.mapper.js'
import type { AuthDatabase } from './drizzle-user.repository.js'

@Injectable()
export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  constructor(@Inject(DATABASE) private readonly database: AuthDatabase) {}

  async save(session: AuthSession): Promise<void> {
    const row = authSessionMapper.toRow(session)

    await this.database
      .insert(authSession)
      .values(row)
      .onConflictDoUpdate({ target: authSession.id, set: { expiresAt: row.expiresAt } })
  }

  async findOne(criteria: AuthSessionCriteria): Promise<AuthSession | null> {
    const rows = await this.database
      .select()
      .from(authSession)
      .where(this.toCondition(criteria))
      .limit(1)

    const row = rows[0]
    return row === undefined ? null : authSessionMapper.toDomain(row)
  }

  async delete(id: string): Promise<void> {
    await this.database.delete(authSession).where(eq(authSession.id, id))
  }

  async deleteAllFor(userId: string): Promise<void> {
    await this.database.delete(authSession).where(eq(authSession.userId, userId))
  }

  private toCondition(criteria: AuthSessionCriteria): SQL | undefined {
    const conditions: SQL[] = []

    const id = criteria.get('id')
    if (id !== undefined) {
      conditions.push(eq(authSession.id, id))
    }

    const userId = criteria.get('userId')
    if (userId !== undefined) {
      conditions.push(eq(authSession.userId, userId))
    }

    return conditions.length === 0 ? undefined : and(...conditions)
  }
}
