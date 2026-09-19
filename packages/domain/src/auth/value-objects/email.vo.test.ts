import { Email } from '@domain/auth/value-objects/email.vo.js'
import { describe, expect, it } from 'vitest'

describe('email', () => {
  it('accepts a well-formed address', () => {
    expect(Email.create('ian@example.test').value).toBe('ian@example.test')
  })

  it('normalises case and surrounding whitespace, so one person is one account', () => {
    expect(Email.create('  Ian@Example.TEST ').value).toBe('ian@example.test')
  })

  it('compares by value', () => {
    expect(Email.create('ian@example.test').equals(Email.create('IAN@example.test'))).toBe(true)
  })

  it('rejects an address with no at sign', () => {
    expect(() => Email.create('not-an-email')).toThrow(/email/i)
  })

  it('rejects an empty address', () => {
    expect(() => Email.create('   ')).toThrow(/email/i)
  })

  it('rejects an address with no domain', () => {
    expect(() => Email.create('ian@')).toThrow(/email/i)
  })
})
