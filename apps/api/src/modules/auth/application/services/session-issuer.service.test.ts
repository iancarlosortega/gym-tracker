import { SessionIssuer } from '@api/modules/auth/application/services/session-issuer.service.js'
import {
  FixedClock,
  InMemoryAuthSessionRepository,
} from '@api/modules/auth/testing/in-memory-auth.js'
import type { AuthSessionCriteriaFields } from '@gym/domain/auth/repositories/auth-session.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { describe, expect, it } from 'vitest'

describe('issuing a session', () => {
  it('stores a session for the user that expires after the configured lifetime', async () => {
    const sessions = new InMemoryAuthSessionRepository()
    const issuer = new SessionIssuer(
      sessions,
      new FixedClock(new Date('2026-09-19T12:00:00.000Z')),
      { sessionLifetimeDays: 90 },
    )
    const userId = Id.create()

    const { sessionId, expiresAt } = await issuer.issue(userId)

    const stored = await sessions.findOne(
      Criteria.create<AuthSessionCriteriaFields>({ id: sessionId }),
    )
    expect(stored?.userId.equals(userId)).toBe(true)
    expect(expiresAt.toISOString()).toBe('2026-12-18T12:00:00.000Z')
  })
})
