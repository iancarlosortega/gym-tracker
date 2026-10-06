import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { SignUpDto } from './sign-up.dto.ts'

function failedProperties(body: unknown): readonly string[] {
  return validateSync(plainToInstance(SignUpDto, body)).map((error) => error.property)
}

describe('the sign-up request contract', () => {
  it('accepts a well-formed body', () => {
    expect(
      failedProperties({ email: 'new@example.test', password: 'correct horse battery' }),
    ).toEqual([])
  })

  it('rejects a body with no fields', () => {
    expect(failedProperties({}).sort()).toEqual(['email', 'password'])
  })

  it('leaves the password length to the policy, so a 513-character password gets the policy message', () => {
    expect(failedProperties({ email: 'new@example.test', password: 'x'.repeat(513) })).toEqual([])
  })

  it('still refuses a body too large to be any password at all', () => {
    expect(failedProperties({ email: 'new@example.test', password: 'x'.repeat(2049) })).toContain(
      'password',
    )
  })

  it('leaves the address to the domain, which reports it as unusable', () => {
    expect(failedProperties({ email: 'not-an-email', password: 'correct horse' })).toEqual([])
  })
})
