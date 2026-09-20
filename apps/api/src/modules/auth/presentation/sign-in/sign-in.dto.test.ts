import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { SignInDto } from './sign-in.dto.ts'

function failedProperties(body: unknown): readonly string[] {
  return validateSync(plainToInstance(SignInDto, body)).map((error) => error.property)
}

describe('the sign-in request contract', () => {
  it('accepts a well-formed body', () => {
    expect(failedProperties({ email: 'ian@example.test', password: 'secret' })).toEqual([])
  })

  it('rejects a body with no fields', () => {
    expect(failedProperties({}).sort()).toEqual(['email', 'password'])
  })

  it('rejects a password that is not a string', () => {
    expect(failedProperties({ email: 'ian@example.test', password: 12_345 })).toContain('password')
  })

  it('rejects an empty password rather than passing it on', () => {
    expect(failedProperties({ email: 'ian@example.test', password: '' })).toContain('password')
  })

  it('rejects an absurdly long password instead of hashing it', () => {
    expect(failedProperties({ email: 'ian@example.test', password: 'x'.repeat(513) })).toContain(
      'password',
    )
  })

  it('does not reject a malformed address, because the use case must treat it like any other failure', () => {
    expect(failedProperties({ email: 'not-an-email', password: 'secret' })).toEqual([])
  })
})
