import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { describe, expect, it } from 'vitest'
import { type RequestWithCaller, readSessionId, readUserId } from './caller.decorator.ts'

const userId = Id.create()
const sessionId = Id.create()

const signedIn = {
  caller: { user: { id: userId }, session: { id: sessionId }, renewed: false },
} as unknown as RequestWithCaller

describe('reading the caller from a request', () => {
  it('returns the signed-in user id', () => {
    expect(readUserId(signedIn)).toBe(userId.value)
  })

  it('returns the session id', () => {
    expect(readSessionId(signedIn)).toBe(sessionId.value)
  })

  it('throws rather than returning an empty id when no caller was resolved', () => {
    expect(() => readUserId({})).toThrow(/session guard/i)
  })

  it('reports no session rather than inventing one', () => {
    expect(readSessionId({})).toBeUndefined()
  })
})
