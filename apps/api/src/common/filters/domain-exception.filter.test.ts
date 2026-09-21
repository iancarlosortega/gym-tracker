import {
  AUTH_ERROR_CODES,
  DomainError,
  type DomainErrorCode,
  MEASUREMENT_ERROR_CODES,
  SHARED_ERROR_CODES,
} from '@gym/domain/shared/errors/domain-error'
import { describe, expect, it, vi } from 'vitest'
import { DomainExceptionFilter } from './domain-exception.filter.ts'

class StubError extends DomainError {
  constructor(readonly errorCode: DomainErrorCode) {
    super(`stub `)
  }
}

function capture(error: DomainError): { status: number; body: unknown } {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) }

  new DomainExceptionFilter().catch(error, host as never)

  return { status: status.mock.calls[0]?.[0] as number, body: json.mock.calls[0]?.[0] }
}

const everyCode = [...SHARED_ERROR_CODES, ...AUTH_ERROR_CODES, ...MEASUREMENT_ERROR_CODES]

describe('mapping domain errors to http', () => {
  it('maps every declared code to a real status, so none can fall through', () => {
    for (const code of everyCode) {
      expect(capture(new StubError(code)).status).toBeLessThan(500)
    }
  })

  it('maps a failed sign-in to 401', () => {
    expect(capture(new StubError('AUTHENTICATION_FAILED')).status).toBe(401)
  })

  it('does not leak the domain message for a failed sign-in', () => {
    const { body } = capture(new StubError('AUTHENTICATION_FAILED'))

    expect(JSON.stringify(body)).not.toContain('stub AUTHENTICATION_FAILED')
    expect(JSON.stringify(body)).toContain('do not match an account')
  })

  it('maps a duplicate account to 409', () => {
    expect(capture(new StubError('ACCOUNT_ALREADY_EXISTS')).status).toBe(409)
  })

  it('maps a measurement rule to 400', () => {
    expect(capture(new StubError('MISSING_BAR_WEIGHT')).status).toBe(400)
  })

  it('treats an unmapped code as a server fault rather than blaming the caller', () => {
    expect(capture(new StubError('NOT_A_REAL_CODE' as DomainErrorCode)).status).toBe(500)
  })
})
