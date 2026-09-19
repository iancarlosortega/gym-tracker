import type { authSession } from '@api/database/schema/session.table.js'
import { AuthSession } from '@gym/domain/auth/entities/auth-session.entity'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

type SessionRow = typeof authSession.$inferSelect
type SessionInsert = typeof authSession.$inferInsert

export const authSessionMapper = {
  toDomain(row: SessionRow): AuthSession {
    return AuthSession.restore({
      id: Id.restore(row.id),
      userId: Id.restore(row.userId),
      issuedAt: row.createdAt,
      expiresAt: row.expiresAt,
    })
  },

  toRow(session: AuthSession): SessionInsert {
    return {
      id: session.id.value,
      userId: session.userId.value,
      expiresAt: session.expiresAt,
      createdAt: session.issuedAt,
    }
  },
}
