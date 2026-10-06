import { describe, expect, it } from 'vitest'
import { WeakPasswordError } from '../errors.ts'
import {
  checkPasswordPolicy,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './password-policy.service.ts'

describe('the password policy', () => {
  it('refuses a password one character short of the minimum', () => {
    expect(() => checkPasswordPolicy('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toThrow(
      WeakPasswordError,
    )
  })

  it('accepts a password exactly at the minimum', () => {
    expect(() => checkPasswordPolicy('a'.repeat(PASSWORD_MIN_LENGTH))).not.toThrow()
  })

  it('accepts a password exactly at the maximum', () => {
    expect(() => checkPasswordPolicy('a'.repeat(PASSWORD_MAX_LENGTH))).not.toThrow()
  })

  it('refuses a password one character past the maximum', () => {
    expect(() => checkPasswordPolicy('a'.repeat(PASSWORD_MAX_LENGTH + 1))).toThrow(
      WeakPasswordError,
    )
  })

  it('accepts a spaced passphrase with no digits or symbols, because composition rules are not the policy', () => {
    expect(() => checkPasswordPolicy('correct horse battery staple')).not.toThrow()
  })

  it('counts characters rather than UTF-16 code units, so an emoji password is not cut short', () => {
    expect(() => checkPasswordPolicy('🏋️'.repeat(4))).not.toThrow()
    expect(() => checkPasswordPolicy('🏋'.repeat(7))).toThrow(WeakPasswordError)
  })

  it('pins the bounds the spec names', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8)
    expect(PASSWORD_MAX_LENGTH).toBe(512)
  })
})
